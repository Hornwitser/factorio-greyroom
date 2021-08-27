import { ReadableStream, WritableStream } from "./stream";
import { InputAction, InputActionSegment } from "./input";
import { Version, ModID, ModStartupSetting, SmallProgress, readSmallProgress, writeSmallProgress } from "./data";
import { SynchronizerAction, readSynchronizerAction, writeSynchronizerAction } from "./synchronizer_action";

export enum NetworkMessageType {
	Ping,
	PingReply,
	ConnectionRequest,
	ConnectionRequestReply,
	ConnectionRequestReplyConfirm,
	ConnectionAcceptOrDeny,
	ClientToServerHeartbeat,
	ServerToClientHeartbeat,
	GetOwnAddress,
	GetOwnAddressReply,
	NatPunchRequest,
	NatPunch,
	TransferBlockRequest,
	TransferBlock,
	RequestForHeartbeatWhenDisconnecting,
	LANBroadcast,
	GameInformationRequest,
	GameInformationRequestReply,
	Empty,
}

export abstract class AbstractNetworkMessage {
	abstract type: NetworkMessageType;
	abstract write(stream: WritableStream): void;
}

export class ConnectionRequest implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.ConnectionRequest as const;
	constructor(
		public version: Version,
		public connectionRequestIDGeneratedOnClient: number,
	) { }

	static read(stream: ReadableStream) {
		return new ConnectionRequest(
			Version.read(stream),
			stream.readUInt32(),
		);
	}

	write(stream: WritableStream) {
		this.version.write(stream);
		stream.writeUInt32(this.connectionRequestIDGeneratedOnClient);
	}
}

export class ConnectionRequestReply implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.ConnectionRequestReply;
	constructor(
		public version: Version,
		public connectionRequestIDGeneratedOnClient: number,
		public connectionRequestIDGeneratedOnServer: number,
	) { }

	static read(stream: ReadableStream) {
		return new ConnectionRequestReply(
			Version.read(stream),
			stream.readUInt32(),
			stream.readUInt32(),
		);
	}

	write(stream: WritableStream) {
		this.version.write(stream);
		stream.writeUInt32(this.connectionRequestIDGeneratedOnClient);
		stream.writeUInt32(this.connectionRequestIDGeneratedOnServer);
	}
}


export class ConnectionRequestReplyConfirm implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.ConnectionRequestReplyConfirm;
	constructor(
		public connectionRequestIDGeneratedOnClient: number,
		public connectionRequestIDGeneratedOnServer: number,
		public instanceID: number,
		public username: string,
		public passwordHash: string,
		public serverKey: string,
		public serverKeyTimestamp: string,
		public coreChecksum: number,
		public prototypeListChecksum: number,
		public activeMods: ModID[],
		public startupModSettings: ModStartupSetting[],
	) { }

	static read(stream: ReadableStream) {
		return new ConnectionRequestReplyConfirm(
			stream.readUInt32(),
			stream.readUInt32(),
			stream.readUInt32(),
			stream.readUtf8String(),
			stream.readUtf8String(),
			stream.readUtf8String(),
			stream.readUtf8String(),
			stream.readUInt32(),
			stream.readUInt32(),
			stream.readArray(stream => ModID.read(stream)),
			stream.readArray(stream => ModStartupSetting.read(stream))
		);
	}

	write(stream: WritableStream) {
		stream.writeUInt32(this.connectionRequestIDGeneratedOnClient);
		stream.writeUInt32(this.connectionRequestIDGeneratedOnServer);
		stream.writeUInt32(this.instanceID);
		stream.writeUtf8String(this.username);
		stream.writeUtf8String(this.passwordHash);
		stream.writeUtf8String(this.serverKey);
		stream.writeUtf8String(this.serverKeyTimestamp);
		stream.writeUInt32(this.coreChecksum);
		stream.writeUInt32(this.prototypeListChecksum);
		stream.writeArray(this.activeMods);
		stream.writeArray(this.startupModSettings);
	}
}


export class ClientPeerInfo {
	constructor(
		public username: string,
		public droppingProgress: SmallProgress,
		public mapSavingProgress: SmallProgress,
		public mapDownloadingProgress: SmallProgress,
		public mapLoadingProgress: SmallProgress,
		public tryingToCatchUpProgress: SmallProgress,
	) { }

	static read(stream: ReadableStream) {
		const username = stream.readUtf8String();
		const flags = stream.readUInt8();
		let droppingProgress = null;
		let mapSavingProgress = null;
		let mapDownloadingProgress = null;
		let mapLoadingProgress = null;
		let tryingToCatchUpProgress = null;
		if (flags & 0x01) { droppingProgress = readSmallProgress(stream); }
		if (flags & 0x02) { mapSavingProgress = readSmallProgress(stream); }
		if (flags & 0x04) { mapDownloadingProgress = readSmallProgress(stream); }
		if (flags & 0x08) { mapLoadingProgress = readSmallProgress(stream); }
		if (flags & 0x10) { tryingToCatchUpProgress = readSmallProgress(stream); }
		return new ClientPeerInfo(
			username,
			droppingProgress,
			mapSavingProgress,
			mapDownloadingProgress,
			mapLoadingProgress,
			tryingToCatchUpProgress,
		);
	}

	write(stream: WritableStream) {
		stream.writeUtf8String(this.username);

		let flags = 0;
		if (this.droppingProgress !== null) { flags |= 0x01; }
		if (this.mapSavingProgress !== null) { flags |= 0x02; }
		if (this.mapDownloadingProgress !== null) { flags |= 0x04; }
		if (this.mapLoadingProgress !== null) { flags |= 0x08; }
		if (this.tryingToCatchUpProgress !== null) { flags |= 0x10; }

		stream.writeUInt8(flags);
		if (this.droppingProgress !== null) {
			writeSmallProgress(this.droppingProgress, stream);
		}
		if (this.mapSavingProgress !== null) {
			writeSmallProgress(this.mapSavingProgress, stream);
		}
		if (this.mapDownloadingProgress !== null) {
			writeSmallProgress(this.mapDownloadingProgress, stream);
		}
		if (this.mapLoadingProgress !== null) {
			writeSmallProgress(this.mapLoadingProgress, stream);
		}
		if (this.tryingToCatchUpProgress !== null) {
			writeSmallProgress(this.tryingToCatchUpProgress, stream);
		}
	}
}


export class ClientsPeerInfo {
	constructor(
		public serverUsername: string,
		public mapSavingProgress: SmallProgress,
		public savingFor: number[],
		public clientPeerInfo: Map<number, ClientPeerInfo>,
	) { }

	static read(stream: ReadableStream) {
		return new ClientsPeerInfo(
			stream.readUtf8String(),
			readSmallProgress(stream),
			stream.readArray(
				stream => stream.readSpaceOptimizedUInt16(),
				stream => stream.readSpaceOptimizedUInt16(),
			),
			stream.readMap(
				stream => stream.readSpaceOptimizedUInt16(),
				stream => ClientPeerInfo.read(stream),
			),
		);
	}

	write(stream: WritableStream) {
		stream.writeUtf8String(this.serverUsername);
		writeSmallProgress(this.mapSavingProgress, stream);
		stream.writeArray(
			this.savingFor,
			(item, stream) => { stream.writeSpaceOptimizedUInt16(item) },
			(size, stream) => { stream.writeSpaceOptimizedUInt16(size) },
		);
		stream.writeMap(
			this.clientPeerInfo,
			(key, stream) => { stream.writeSpaceOptimizedUInt16(key); }
		);
	}
}

export enum ConnectionRequestStatus {
	Valid,
	ModsMismatch,
	CoreModMismatch,
	ModStartupSettingsMismatch,
	PrototypeChecksumMismatch,
	PlayerLimitReached,
	PasswordMissing,
	PasswordMismatch,
	UserVerificationMissing,
	UserVerificationTimeout,
	UserVerificationMismatch,
	UserBanned,
	AddressUsedForDifferentPlayer,
	UserWithThatNameAlreadyInGame,
	UserNotWhitelisted,
}


export class ConnectionAcceptOrDeny implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.ConnectionAcceptOrDeny;
	constructor(
		public connectionRequestIDGeneratedOnClient: number,
		public status: ConnectionRequestStatus,
		public gameName: string,
		public serverHash: string,
		public description: string,
		public latency: number,
		public gameID: number,
		public steamID: Buffer,
		public clientsPeerInfo: ClientsPeerInfo,
		public firstSequenceNumberToExpect: number,
		public firstSequenceNumberToSend: number,
		public newPeerID: number,
		public activeMods: ModID[],
		public startupModSettings: ModStartupSetting[],
		public pausedBy: number,
	) { }

	static read(stream: ReadableStream) {
		return new ConnectionAcceptOrDeny(
			stream.readUInt32(),
			stream.readUInt8(),
			stream.readUtf8String(),
			stream.readUtf8String(),
			stream.readUtf8String(),
			stream.readUInt8(),
			stream.readUInt32(),
			stream.readBuffer(8),
			ClientsPeerInfo.read(stream),
			stream.readUInt32(),
			stream.readUInt32(),
			stream.readUInt16(),
			stream.readArray(stream => ModID.read(stream)),
			stream.readArray(stream => ModStartupSetting.read(stream)),
			stream.readUInt16(),
		);
	}

	write(stream: WritableStream) {
		stream.writeUInt32(this.connectionRequestIDGeneratedOnClient);
		stream.writeUInt8(this.status);
		stream.writeUtf8String(this.gameName);
		stream.writeUtf8String(this.serverHash);
		stream.writeUtf8String(this.description);
		stream.writeUInt8(this.latency);
		stream.writeUInt32(this.gameID);
		stream.writeBuffer(this.steamID);
		this.clientsPeerInfo.write(stream);
		stream.writeUInt32(this.firstSequenceNumberToExpect);
		stream.writeUInt32(this.firstSequenceNumberToSend);
		stream.writeUInt16(this.newPeerID);
		stream.writeArray(this.activeMods);
		stream.writeArray(this.startupModSettings);
		stream.writeUInt16(this.pausedBy);
	}
}


export class TickClosure {
	constructor(
		public updateTick: number,
		public inputActions: InputAction[],
		public inputActionSegments: InputActionSegment[],
	) { }

	static read(stream: ReadableStream, isEmpty: boolean) {
		const updateTick = stream.readUInt32();
		if (isEmpty) {
			return new TickClosure(
				updateTick,
				[],
				[],
			);
		}

		const flags = stream.readSpaceOptimizedUInt32()
		const hasInputActionSegments = Boolean(flags & 0x1);
		const inputActionCount = flags >> 1;
		const inputActions = [];

		let lastPlayerIndex = 0xffff;
		for (let i = 0; i < inputActionCount; i++) {
			const action = InputAction.read(stream, lastPlayerIndex);
			lastPlayerIndex = action.playerIndex;
			inputActions.push(action);
		}

		let inputActionSegments: InputActionSegment[] = [];
		if (hasInputActionSegments) {
			inputActionSegments = stream.readArray(
				stream => InputActionSegment.read(stream)
			);
		}

		return new TickClosure(
			updateTick,
			inputActions,
			inputActionSegments,
		)
	}

	write(stream: WritableStream, writeEmpty: boolean) {
		stream.writeUInt32(this.updateTick);
		if (writeEmpty) {
			return;
		}

		const hasInputActionSegments = this.inputActionSegments.length > 0;
		const flags = Number(hasInputActionSegments) | this.inputActions.length << 1;
		stream.writeSpaceOptimizedUInt32(flags);

		let lastPlayerIndex = 0xffff;
		for (let inputAction of this.inputActions) {
			inputAction.write(stream, lastPlayerIndex);
			lastPlayerIndex = inputAction.playerIndex;
		}

		if (hasInputActionSegments) {
			stream.writeArray(this.inputActionSegments);
		}
	}
}


export class Heartbeat {
	constructor(
		public sequenceNumber: number,
		public tickClosures: TickClosure[],
		public nextToReceiveServerTickClosure: number | null,
		public synchronizerActions: SynchronizerAction[],
		public requestsForHeartbeat: number[],
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		const flags = stream.readUInt8();
		const hasHeartbeatRequests = Boolean(flags & 0x01);
		const hasTickClosures = Boolean(flags & 0x02);
		const hasSingleTickClosure = Boolean(flags & 0x04);
		const allTickClosuresAreEmpty = Boolean(flags & 0x08);
		const hasSynchronizerActions = Boolean(flags & 0x10);

		const sequenceNumber = stream.readUInt32();
		const tickClosures = [];
		if (hasTickClosures) {
			let count = 1
			if (!hasSingleTickClosure) {
				count = stream.readSpaceOptimizedUInt32();
			}

			for (let i = 0; i < count; i++) {
				tickClosures.push(TickClosure.read(stream, allTickClosuresAreEmpty));
			}
		}

		let nextToReceiveServerTickClosure = null;
		if (!isServer) {
			nextToReceiveServerTickClosure = stream.readUInt32();
		}

		let synchronizerActions: SynchronizerAction[] = [];
		if (hasSynchronizerActions) {
			synchronizerActions = stream.readArray(
				stream => readSynchronizerAction(stream, isServer)
			);
		}

		let requestsForHeartbeat: number[] = [];
		if (hasHeartbeatRequests) {
			requestsForHeartbeat = stream.readArray(
				stream => stream.readUInt32(),
			);
		}

		return new Heartbeat(
			sequenceNumber,
			tickClosures,
			nextToReceiveServerTickClosure,
			synchronizerActions,
			requestsForHeartbeat,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		const hasHeartbeatRequests = this.requestsForHeartbeat.length > 0;
		const hasTickClosures = this.tickClosures.length > 0;
		const hasSingleTickClosure = this.tickClosures.length == 1;
		const allTickClosuresAreEmpty = hasTickClosures && this.tickClosures.filter(
			tickClosure => tickClosure.inputActions.length > 0 || tickClosure.inputActionSegments.length > 0
		).length === 0;
		const hasSynchronizerActions = this.synchronizerActions.length > 0;

		let flags = 0;
		flags |= Number(hasHeartbeatRequests) * 0x01;
		flags |= Number(hasTickClosures) * 0x02;
		flags |= Number(hasSingleTickClosure) * 0x04;
		flags |= Number(allTickClosuresAreEmpty) * 0x08;
		flags |= Number(hasSynchronizerActions) * 0x10;
		stream.writeUInt8(flags);
		stream.writeUInt32(this.sequenceNumber);

		if (hasTickClosures) {
			if (hasSingleTickClosure) {
				this.tickClosures[0].write(stream, allTickClosuresAreEmpty);
			} else {
				stream.writeSpaceOptimizedUInt32(this.tickClosures.length);
				for (let tickClosure of this.tickClosures) {
					tickClosure.write(stream, allTickClosuresAreEmpty);
				}
			}
		}

		if (!isServer) {
			stream.writeUInt32(this.nextToReceiveServerTickClosure!);
		}

		if (hasSynchronizerActions) {
			stream.writeArray(
				this.synchronizerActions,
				(item, stream) => { writeSynchronizerAction(item, stream, isServer); }
			);
		}

		if (hasHeartbeatRequests) {
			stream.writeArray(
				this.requestsForHeartbeat,
				(item, stream) => stream.writeUInt32(item),
			);
		}
	}
}

export class ClientToServerHeartbeat implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.ClientToServerHeartbeat;
	constructor(
		public heartbeat: Heartbeat,
	) { }

	static read(stream: ReadableStream) {
		return new ServerToClientHeartbeat(Heartbeat.read(stream, false));
	}

	write(stream: WritableStream) {
		this.heartbeat.write(stream, false);
	}
}


export class ServerToClientHeartbeat implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.ServerToClientHeartbeat;
	constructor(
		public heartbeat: Heartbeat,
	) { }

	static read(stream: ReadableStream) {
		return new ServerToClientHeartbeat(Heartbeat.read(stream, true));
	}

	write(stream: WritableStream) {
		this.heartbeat.write(stream, true);
	}
}


export class Empty implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.Empty;

	static read(stream: ReadableStream) {
		void stream;
		return new Empty();
	}

	write(stream: WritableStream) {
		void stream;
	}
}

export type NetworkMessage =
	ConnectionRequest |
	ConnectionRequestReply |
	ConnectionRequestReplyConfirm |
	ConnectionAcceptOrDeny |
	ClientToServerHeartbeat |
	ServerToClientHeartbeat |
	Empty
;
