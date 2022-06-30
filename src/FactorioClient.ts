import events from "events";
import UdpClient from "./UdpClient";
import { ModID, Version, DisconnectReason } from "./data";
import {
	InputActionType,
	InputAction,
	InputActionSegment,
	PlayerJoinGameData,
} from "./input";
import { ReadableStream } from "./stream"
import {
	SynchronizerActionType,
	SynchronizerAction,
	PeerDisconnect,
	ClientChangedState,
	ClientMultiplayerStateType,
	IncreasedLatencyConfirm,
	AuxiliaryDataDownloadFinished,
} from "./synchronizer_action";
import {
	NetworkMessageType,
	NetworkMessage,
	ConnectionRequest,
	ConnectionRequestReply,
	ConnectionRequestReplyConfirm,
	ConnectionAcceptOrDeny,
	ConnectionRequestStatus,
	ClientToServerHeartbeat,
	ServerToClientHeartbeat,
	TickClosure,
	Heartbeat,
} from "./network_message";
import { ConnectingFailed, Disconnected } from "./errors";


declare interface FactorioClient {
	on(event: "connection_request_reply", listener: (message: ConnectionRequestReply) => void): this,
	on(event: "connection_accept_or_deny", listener: (message: ConnectionAcceptOrDeny) => void): this,
	on(event: "server_to_client_heartbeat", listener: (message: ServerToClientHeartbeat) => void): this,
	on(event: "tick", listener: () => void): this,
	on(event: "input_action", listener: (inputAction: InputAction) => void): this,
	on(event: "synchronizer_action", listener: (synchronizerActions: SynchronizerAction) => void): this,
	on(event: "join_game", listener: (data: { playerIndex: number }) => void): this,
	on(event: "close", listener: () => void): this,
	on(event: "error", listener: (err: Error) => void): this,
	on(event: "send_heartbeat", listener: () => void): this,
	emit(event: "connection_request_reply", message: ConnectionRequestReply): boolean,
	emit(event: "connection_accept_or_deny", message: ConnectionAcceptOrDeny): boolean,
	emit(event: "server_to_client_heartbeat", message: ServerToClientHeartbeat): boolean,
	emit(event: "tick"): boolean,
	emit(event: "input_action", inputAction: InputAction): boolean,
	emit(event: "synchronizer_action", synchronizerActions: SynchronizerAction): boolean,
	emit(event: "join_game", data: { playerIndex: number }): boolean,
	emit(event: "close"): boolean,
	emit(event: "error", err: Error): boolean,
	emit(event: "send_heartbeat"): boolean,
}

class FactorioClient extends events.EventEmitter {
	public version = new Version(0, 0, 0, 0);

	clientRequestID?: number;
	connection = new UdpClient();
	stepTimeInterval?: NodeJS.Timer;
	clientSequence = 0;
	serverSequence = 0;
	synchronizerActionsToSend: SynchronizerAction[] = [];
	updateTick: number | null = null;
	tickClosuresReceived = new Map<number, TickClosure>();
	inputActionSegmentsReceived = new Map<number, Map<number, InputActionSegment[]>>();
	inputActionSegmentsCompleted: InputActionSegment[][] = []
	nextTickClosureToSend: number | null = null;
	tickClosuresToSend: TickClosure[] = [];
	inputActionsToSend = new Map<number, InputAction[]>();
	latency = 0;
	playerIndex: number | null = null;
	peerID: number | null = null;
	state = ClientMultiplayerStateType.Ready;
	connected = false;

	reset() {
		delete this.clientRequestID;
		this.connection.reset();
		if (this.stepTimeInterval) {
			clearInterval(this.stepTimeInterval);
			delete this.stepTimeInterval;
		}
		this.clientSequence = 0;
		this.serverSequence = 0;
		this.synchronizerActionsToSend = [];
		this.updateTick = null;
		this.tickClosuresReceived = new Map();
		this.nextTickClosureToSend = null;
		this.tickClosuresToSend = [];
		this.inputActionsToSend = new Map();
		this.latency = 0;
		this.playerIndex = null;
		this.peerID = null;
		this.state = ClientMultiplayerStateType.Ready;
		this.connected = false;
	}

	constructor(
		public playerName: string,
		public coreChecksum: number,
		public prototypeListChecksum: number,
		public activeMods: ModID[],
		public password: string = "",
	) {
		super();
		this.connection.on("message", this.handleMessage.bind(this));
		this.connection.on("close", () => { this.emit("close"); });
		this.connection.on("error", err => {
			this.abort();
			this.emit("error", err);
		});
	}

	changeState(newState: ClientMultiplayerStateType) {
		if (this.connected) {
			this.synchronizerActionsToSend.push(new ClientChangedState(newState));
		}
		this.state = newState;
	}

	async connect(address: string, port: number) {
		await this.connection.connect(address, port);
		this.changeState(ClientMultiplayerStateType.Connecting);
		this.clientRequestID = Math.round(Math.random() * 2 ** 32);
		const request = new ConnectionRequest(this.version, this.clientRequestID);
		this.connection.send(request);
		await events.once(this, "join_game");
	}

	/**
	 * Aborts any current connection
	 */
	abort() {
		if (this.stepTimeInterval) {
			this.synchronizerActionsToSend = [new PeerDisconnect(DisconnectReason.Quit)];
			this.tickClosuresToSend = [];
			this.sendHeartbeat();
		}

		this.reset();
	}

	close() {
		this.abort();
		this.connection.close();
	}

	handleMessage(message: NetworkMessage) {
		switch (message.type) {
			case NetworkMessageType.ConnectionRequestReply:
				this.emit("connection_request_reply", message);
				if (this.state !== ClientMultiplayerStateType.Connecting) {
					break;
				}
				const confirm = new ConnectionRequestReplyConfirm(
					this.clientRequestID!,
					message.connectionRequestIDGeneratedOnServer,
					0,
					this.playerName,
					this.password,
					"",
					"",
					this.coreChecksum,
					this.prototypeListChecksum,
					this.activeMods,
					[],
				);
				this.connection.send(confirm);
				break;

			case NetworkMessageType.ConnectionAcceptOrDeny:
				this.emit("connection_accept_or_deny", message);
				if (this.state !== ClientMultiplayerStateType.Connecting) {
					break;
				}
				if (message.status !== ConnectionRequestStatus.Valid) {
					this.abort();
					this.emit("error", new ConnectingFailed(
						`Server refused connection: ${ConnectionRequestStatus[message.status]} (${message.status})`,
						message.status,
					));
					break;
				}

				// We have a connection, start sending heartbeats.
				this.connected = true;
				this.latency = message.latency;
				this.peerID = message.newPeerID;
				this.clientSequence = message.firstSequenceNumberToSend;
				this.serverSequence = message.firstSequenceNumberToExpect;
				this.stepTimeInterval = setInterval(() => {
					try {
						this.stepTime();
					} catch (err: any) {
						this.abort();
						this.emit("error", err);
					}
				}, 1000 / 60);
				break;

			case NetworkMessageType.ServerToClientHeartbeat:
				this.emit("server_to_client_heartbeat", message);
				for (let tickClosure of message.heartbeat.tickClosures) {
					this.tickClosuresReceived.set(tickClosure.updateTick, tickClosure);
				}

				for (let synchronizerAction of message.heartbeat.synchronizerActions) {
					this.emit("synchronizer_action", synchronizerAction);
					switch (synchronizerAction.type) {
						case SynchronizerActionType.PeerDisconnect:
							if (synchronizerAction.peerID === this.peerID) {
								this.reset();
								this.emit("error", new Disconnected(
									`${DisconnectReason[synchronizerAction.reason]} (${synchronizerAction.reason})`,
									synchronizerAction.reason,
								));
							}
							break;

						case SynchronizerActionType.AuxiliaryDataReadyForDownload:
							if (synchronizerAction.peerID !== this.peerID) {
								break;
							}
							this.synchronizerActionsToSend.push(
								new AuxiliaryDataDownloadFinished(),
							);
							break;

						case SynchronizerActionType.MapReadyForDownload:
							if (synchronizerAction.peerID !== this.peerID) {
								break;
							}
							this.updateTick = synchronizerAction.updateTick;
							this.changeState(ClientMultiplayerStateType.ConnectedDownloadingMap);
							this.changeState(ClientMultiplayerStateType.WaitingForCommandToStartSendingTickClosures);
							break;

						case SynchronizerActionType.ClientShouldStartSendingTickClosures:
							if (synchronizerAction.peerID !== this.peerID) {
								break;
							}
							this.changeState(ClientMultiplayerStateType.InGame);
							this.nextTickClosureToSend = synchronizerAction.firstExpectedTickClosureTick;
							break;

						case SynchronizerActionType.ChangeLatency:
							this.nextTickClosureToSend = this.updateTick! + this.latency;
							if (this.latency < synchronizerAction.latency) {
								this.synchronizerActionsToSend.push(new IncreasedLatencyConfirm(
									this.updateTick! + this.latency, synchronizerAction.latency - this.latency
								));
							}
							this.latency = synchronizerAction.latency;
							break;

						case SynchronizerActionType.NewPeerInfo:
						case SynchronizerActionType.PeerDroppingProgressUpdate:
						case SynchronizerActionType.MapSavingProgressUpdate:
						case SynchronizerActionType.SavingForUpdate:
						case SynchronizerActionType.SavingCountDown:
							break; // Ignore

						default:
							this.abort();
							const actionName = SynchronizerActionType[synchronizerAction.type];
							this.emit("error", new Error(
								`Unhandled synchronizer action ${actionName} (${synchronizerAction.type})`
							));
						}
				}
				break;

			case NetworkMessageType.Empty:
				break;

			default:
				this.abort();
				this.emit("error", new Error(`Unhandled message ${NetworkMessageType[message.type]}`));
		}
	}

	handleInputAction(action: InputAction) {
		this.emit("input_action", action);
		if (action.type === InputActionType.PlayerJoinGame) {
			const playerJoinData = action.data! as PlayerJoinGameData;
			if (playerJoinData.peerID === this.peerID) {
				this.playerIndex = playerJoinData.playerIndex;
				this.emit("join_game", { playerIndex: this.playerIndex });
			}
		}
	}

	handleInputActionSegment(segment: InputActionSegment) {
		let playerSegments = this.inputActionSegmentsReceived.get(segment.playerIndex);
		if (!playerSegments) {
			playerSegments = new Map();
			this.inputActionSegmentsReceived.set(segment.playerIndex, playerSegments);
		}
		let inputSegments = playerSegments.get(segment.id);
		if (!inputSegments) {
			inputSegments = [];
			playerSegments.set(segment.id, inputSegments);
		}
		inputSegments.push(segment);

		if (segment.segmentNumber + 1 === segment.totalSegments) {
			this.inputActionSegmentsCompleted.push(inputSegments);
			playerSegments.delete(segment.id);
		}
	}

	reassembleCompletedInputActionSegments() {
		const actions = [];
		for (let segments of this.inputActionSegmentsCompleted) {
			const parts: Buffer[] = [];
			for (let i = 0; i < segments.length; i++) {
				if (segments[i].segmentNumber !== i) {
					throw new Error("Received out of order input action segment");
				}
				parts.push(segments[i].payload);
			}

			const inputStream = new ReadableStream(Buffer.concat(parts));
			actions.push(InputAction.readPayload(inputStream, segments[0].type));
		}
		this.inputActionSegmentsCompleted = [];
		return actions;
	}

	sendInTickClosure(updateTick: number, action: InputAction) {
		if (this.playerIndex == null) {
			throw new Error("Cannot send actions before having joined the game");
		}

		if (action.playerIndex === undefined) {
			action.playerIndex = this.playerIndex;
		}

		let toSend = this.inputActionsToSend.get(updateTick);
		if (toSend) {
			toSend.push(action);
		} else {
			this.inputActionsToSend.set(updateTick, [action]);
		}
	}

	sendInNextTickClosure(action: InputAction) {
		if (this.updateTick === null || this.nextTickClosureToSend === null) {
			throw new Error("Cannot send actions before having joined the game");
		}

		let updateTick = Math.max(this.nextTickClosureToSend, this.updateTick + this.latency);
		this.sendInTickClosure(updateTick, action);
	}

	stepTime() {
		// For now simulate a client which instantly catches up with the server.
		while (this.updateTick !== null && this.tickClosuresReceived.has(this.updateTick)) {
			this.stepTick();
		}

		this.sendHeartbeat();
	}

	stepTick() {
		if (this.updateTick === null) {
			throw new Error("Cannot step unknown tick");
		}

		const serverTickClosure = this.tickClosuresReceived.get(this.updateTick);
		if (!serverTickClosure) {
			throw new Error("Server tick closure has not been received");
		}

		this.emit("tick");
		for (let inputAction of serverTickClosure.inputActions) {
			this.handleInputAction(inputAction)
		}

		for (let inputActionSegment of serverTickClosure.inputActionSegments) {
			this.handleInputActionSegment(inputActionSegment);
		}

		for (let inputAction of this.reassembleCompletedInputActionSegments()) {
			this.handleInputAction(inputAction);
		}

		const latencyTick = this.updateTick + this.latency;
		if (latencyTick === this.nextTickClosureToSend) {
			this.tickClosuresToSend.push(new TickClosure(
				latencyTick,
				this.inputActionsToSend.get(latencyTick) || [],
				[]
			));
			this.nextTickClosureToSend++;

		} else if (this.inputActionsToSend.get(latencyTick)) {
			throw new Error("Input actions to send before the server expected them");
		}

		this.tickClosuresReceived.delete(this.updateTick);
		this.inputActionsToSend.delete(latencyTick);
		this.updateTick++;
	}

	sendHeartbeat() {
		this.emit("send_heartbeat");
		let heartbeat = new Heartbeat(
			this.clientSequence++,
			this.tickClosuresToSend,
			this.updateTick !== null ? this.updateTick : 2 ** 32 - 1,
			this.synchronizerActionsToSend,
			[],
		);
		this.tickClosuresToSend = [];
		this.synchronizerActionsToSend = [];
		this.connection.send(new ClientToServerHeartbeat(heartbeat));
	}
}

export default FactorioClient;
