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
	ConnectionRequestReplyConfirm,
	ConnectionRequestStatus,
	ClientToServerHeartbeat,
	TickClosure,
	Heartbeat,
} from "./network_message";


declare interface FactorioClient {
	on(event: "join_game", listener: (data: { playerIndex: number }) => void): this,
	on(event: "error", listener: (err: Error) => void): this,
	on(event: "send_heartbeat", listener: () => void): this,
	emit(event: "join_game", data: { playerIndex: number }): boolean,
	emit(event: "error", err: Error): boolean,
	emit(event: "send_heartbeat"): boolean,
}

class FactorioClient extends events.EventEmitter {
	clientRequestID?: number;
	activeMods: ModID[] = [];
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
	started = Date.now();


	constructor(
		public playerName: string,
		public coreChecksum: number,
		public prototypeListChecksum: number,
	) {
		super();
		this.connection.on("message", this.handleMessage.bind(this));
		this.connection.on("error", (err) => {
			this.abort();
			this.emit("error", err);
		});
	}

	async connect(address: string, port: number) {
		await this.connection.connect(address, port);
		this.clientRequestID = Math.round(Math.random() * 2 ** 32);
		const request = new ConnectionRequest(new Version(1, 1, 38, 0), this.clientRequestID);
		this.connection.send(request);
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

	reset() {
		delete this.clientRequestID;
		this.activeMods = [];
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
	}

	handleMessage(message: NetworkMessage) {
		switch (message.type) {
			case NetworkMessageType.ConnectionRequestReply:
				const confirm = new ConnectionRequestReplyConfirm(
					this.clientRequestID!,
					message.connectionRequestIDGeneratedOnServer,
					0,
					this.playerName,
					"",
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
				console.log("Connection status:", ConnectionRequestStatus[message.status]);
				if (message.status === ConnectionRequestStatus.ModsMissmatch && !this.activeMods.length) {
					console.log("Retrying with mods from server");
					this.activeMods = message.activeMods;
					this.clientRequestID = Math.round(Math.random() * 2 ** 32);
					const request = new ConnectionRequest(new Version(1, 1, 38, 0), this.clientRequestID);
					this.connection.send(request);

				} else if (message.status === ConnectionRequestStatus.Valid && !this.heartbeatInterval) {
					// We have a connection, start sending heartbeats.

					this.latency = message.latency;
					this.peerID = message.newPeerID;
					this.clientSequence = message.firstSequenceNumberToSend;
					this.serverSequence = message.firstSequenceNumberToExpect;
					this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 1000 / 30);
				}
				break;

			case NetworkMessageType.ServerToClientHeartbeat:
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
							this.synchronizerActionsToSend.push(
								new ClientChangedState(
									ClientMultiplayerStateType.ConnectedDownloadingMap,
								),
								new ClientChangedState(
									ClientMultiplayerStateType.WaitingForCommandToStartSendingTickClosures,
								),
							);
							break;

						case SynchronizerActionType.ClientShouldStartSendingTickClosures:
							this.synchronizerActionsToSend.push(
								new ClientChangedState(ClientMultiplayerStateType.InGame),
							);
							this.currentTickClosure = synchronizerAction.firstExpectedTickClosureTick;
							break;

						case SynchronizerActionType.ChangeLatency:
							this.latency = synchronizerAction.latency;
							break;

						case SynchronizerActionType.PeerDisconnect:
						case SynchronizerActionType.MapSavingProgressUpdate:
							break; // Ignore

						default:
							console.log("Unandled sync", SynchronizerActionType[synchronizerAction.type]);
					}
				}
				break;

			default:
				console.log("Unhandled message", NetworkMessageType[message.type]);
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
