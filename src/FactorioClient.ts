import events from "events";
import UdpClient from "./UdpClient";
import { ModID, Version, DisconnectReason } from "./data";
import {
	InputActionType,
	InputAction,
	PlayerJoinGameData,
} from "./input";
import {
	SynchronizerActionType,
	SynchronizerAction,
	PeerDisconnect,
	ClientChangedState,
	ClientMultiplayerStateType,
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
import { ConnectingFailed } from "./errors";


declare interface FactorioClient {
	on(event: "connection_request_reply", listener: (message: ConnectionRequestReply) => void): this,
	on(event: "connection_accept_or_deny", listener: (message: ConnectionAcceptOrDeny) => void): this,
	on(event: "server_to_client_heartbeat", listener: (message: ServerToClientHeartbeat) => void): this,
	on(event: "join_game", listener: (data: { playerIndex: number }) => void): this,
	on(event: "close", listener: () => void): this,
	on(event: "error", listener: (err: Error) => void): this,
	on(event: "send_heartbeat", listener: () => void): this,
	emit(event: "connection_request_reply", message: ConnectionRequestReply): boolean,
	emit(event: "connection_accept_or_deny", message: ConnectionAcceptOrDeny): boolean,
	emit(event: "server_to_client_heartbeat", message: ServerToClientHeartbeat): boolean,
	emit(event: "join_game", data: { playerIndex: number }): boolean,
	emit(event: "close"): boolean,
	emit(event: "error", err: Error): boolean,
	emit(event: "send_heartbeat"): boolean,
}

class FactorioClient extends events.EventEmitter {
	public version = new Version(0, 0, 0, 0);

	clientRequestID?: number;
	connection = new UdpClient();
	heartbeatInterval?: NodeJS.Timer;
	clientSequence = 0;
	serverSequence = 0;
	synchronizerActionsToSend: SynchronizerAction[] = [];
	inputActionsToSend: InputAction[] = [];
	nextToReceiveServerTickClosure: number = 2 ** 32 - 1
	currentTickClosure: number | null = null;
	latency = 0;
	playerIndex: number | null = null;
	peerID: number | null = null;
	state = ClientMultiplayerStateType.Ready;
	connected = false;

	reset() {
		delete this.clientRequestID;
		this.connection.reset();
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			delete this.heartbeatInterval;
		}
		this.clientSequence = 0;
		this.serverSequence = 0;
		this.synchronizerActionsToSend = [];
		this.inputActionsToSend = [];
		this.nextToReceiveServerTickClosure = 2 ** 32 - 1;
		this.currentTickClosure = null;
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
		if (this.heartbeatInterval) {
			this.synchronizerActionsToSend = [new PeerDisconnect(DisconnectReason.Quit)];
			this.inputActionsToSend = [];
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
				this.heartbeatInterval = setInterval(() => {
					try {
						this.sendHeartbeat();
					} catch (err) {
						this.abort();
						this.emit("error", err);
					}
				}, 1000 / 30);
				break;

			case NetworkMessageType.ServerToClientHeartbeat:
				this.emit("server_to_client_heartbeat", message);
				for (let tickClosure of message.heartbeat.tickClosures) {
					this.nextToReceiveServerTickClosure = tickClosure.updateTick + 1;
					for (let inputAction of tickClosure.inputActions) {
						if (inputAction.type === InputActionType.PlayerJoinGame) {
							const playerJoinData = inputAction.data! as PlayerJoinGameData;
							if (playerJoinData.peerID === this.peerID) {
								this.playerIndex = playerJoinData.playerIndex;
								this.emit("join_game", { playerIndex: this.playerIndex });
							}
						}
					}
				}

				for (let synchronizerAction of message.heartbeat.synchronizerActions) {
					if (synchronizerAction.peerID !== this.peerID) {
						continue; // Ignore actions targeting other clients
					}
					switch (synchronizerAction.type) {
						case SynchronizerActionType.AuxiliaryDataReadyForDownload:
							this.synchronizerActionsToSend.push(
								new AuxiliaryDataDownloadFinished(),
							);
							break;

						case SynchronizerActionType.MapReadyForDownload:
							this.changeState(ClientMultiplayerStateType.ConnectedDownloadingMap);
							this.changeState(ClientMultiplayerStateType.WaitingForCommandToStartSendingTickClosures);
							break;

						case SynchronizerActionType.ClientShouldStartSendingTickClosures:
							this.changeState(ClientMultiplayerStateType.InGame);
							this.currentTickClosure = synchronizerAction.firstExpectedTickClosureTick;
							break;

						case SynchronizerActionType.ChangeLatency:
							this.latency = synchronizerAction.latency;
							break;

						case SynchronizerActionType.PeerDisconnect:
						case SynchronizerActionType.NewPeerInfo:
						case SynchronizerActionType.MapSavingProgressUpdate:
						case SynchronizerActionType.SavingForUpdate:
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

			default:
				this.abort();
				this.emit("error", new Error(`Unhandled message ${NetworkMessageType[message.type]}`));
		}
	}

	sendHeartbeat() {
		this.emit("send_heartbeat");
		const tickClosures: TickClosure[] = [];
		if (this.currentTickClosure !== null) {
			let count = (this.nextToReceiveServerTickClosure - 1 + this.latency) - this.currentTickClosure;
			// We send up to three tick closures per heartbeat
			count = Math.max(0, Math.min(count, 3))
			for (let i = 0; i < count; i++) {
				tickClosures.push(new TickClosure(
					this.currentTickClosure++,
					this.inputActionsToSend,
					[],
				))
				this.inputActionsToSend = [];
			}
		}

		const heartbeat = new Heartbeat(
			this.clientSequence++,
			tickClosures,
			this.nextToReceiveServerTickClosure,
			this.synchronizerActionsToSend,
			[],
		);
		this.synchronizerActionsToSend = [];

		this.connection.send(new ClientToServerHeartbeat(heartbeat));
	}
}

export default FactorioClient;
