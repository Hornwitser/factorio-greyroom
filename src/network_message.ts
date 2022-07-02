import {
	Readable, Writable, Streamable,
	readUInt8, readUInt16, readUInt32, readSpaceOptimizedUInt16, readSpaceOptimizedUInt32,
	readBuffer, readUtf8String, readArray, readMap,
	writeUInt8, writeUInt16, writeUInt32, writeSpaceOptimizedUInt16, writeSpaceOptimizedUInt32,
	writeBuffer, writeUtf8String, writeArray, writeMap,
} from "./stream";
import { InputAction, InputActionSegment } from "./input";
import { Version, ModID, PropertyTree, SmallProgress, readSmallProgress, writeSmallProgress } from "./data";
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
}

export class ConnectionRequest implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.ConnectionRequest as const;
	constructor(
		public version: Version,
		public connectionRequestIDGeneratedOnClient: number,
	) { }

	static read(stream: Readable) {
		return new ConnectionRequest(
			Version.read(stream),
			readUInt32(stream),
		);
	}

	static write(stream: Writable, message: ConnectionRequest) {
		Version.write(stream, message.version);
		writeUInt32(stream, message.connectionRequestIDGeneratedOnClient);
	}
}

export class ConnectionRequestReply implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.ConnectionRequestReply;
	constructor(
		public version: Version,
		public connectionRequestIDGeneratedOnClient: number,
		public connectionRequestIDGeneratedOnServer: number,
	) { }

	static read(stream: Readable) {
		return new ConnectionRequestReply(
			Version.read(stream),
			readUInt32(stream),
			readUInt32(stream),
		);
	}

	static write(stream: Writable, message: ConnectionRequestReply) {
		Version.write(stream, message.version);
		writeUInt32(stream, message.connectionRequestIDGeneratedOnClient);
		writeUInt32(stream, message.connectionRequestIDGeneratedOnServer);
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
		public startupModSettings: PropertyTree,
	) { }

	static read(stream: Readable) {
		return new ConnectionRequestReplyConfirm(
			readUInt32(stream),
			readUInt32(stream),
			readUInt32(stream),
			readUtf8String(stream),
			readUtf8String(stream),
			readUtf8String(stream),
			readUtf8String(stream),
			readUInt32(stream),
			readUInt32(stream),
			readArray(stream, ModID.read),
			PropertyTree.read(stream),
		);
	}

	static write(stream: Writable, message: ConnectionRequestReplyConfirm) {
		writeUInt32(stream, message.connectionRequestIDGeneratedOnClient);
		writeUInt32(stream, message.connectionRequestIDGeneratedOnServer);
		writeUInt32(stream, message.instanceID);
		writeUtf8String(stream, message.username);
		writeUtf8String(stream, message.passwordHash);
		writeUtf8String(stream, message.serverKey);
		writeUtf8String(stream, message.serverKeyTimestamp);
		writeUInt32(stream, message.coreChecksum);
		writeUInt32(stream, message.prototypeListChecksum);
		writeArray(stream, message.activeMods, ModID.write);
		PropertyTree.write(stream, message.startupModSettings);
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

	static read(stream: Readable) {
		const username = readUtf8String(stream);
		const flags = readUInt8(stream);
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

	static write(stream: Writable, info: ClientPeerInfo) {
		writeUtf8String(stream, info.username);

		let flags = 0;
		if (info.droppingProgress !== null) { flags |= 0x01; }
		if (info.mapSavingProgress !== null) { flags |= 0x02; }
		if (info.mapDownloadingProgress !== null) { flags |= 0x04; }
		if (info.mapLoadingProgress !== null) { flags |= 0x08; }
		if (info.tryingToCatchUpProgress !== null) { flags |= 0x10; }

		writeUInt8(stream, flags);
		if (info.droppingProgress !== null) {
			writeSmallProgress(stream, info.droppingProgress);
		}
		if (info.mapSavingProgress !== null) {
			writeSmallProgress(stream, info.mapSavingProgress);
		}
		if (info.mapDownloadingProgress !== null) {
			writeSmallProgress(stream, info.mapDownloadingProgress);
		}
		if (info.mapLoadingProgress !== null) {
			writeSmallProgress(stream, info.mapLoadingProgress);
		}
		if (info.tryingToCatchUpProgress !== null) {
			writeSmallProgress(stream, info.tryingToCatchUpProgress);
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

	static read(stream: Readable) {
		return new ClientsPeerInfo(
			readUtf8String(stream),
			readSmallProgress(stream),
			readArray(stream, readSpaceOptimizedUInt16, readSpaceOptimizedUInt16),
			readMap(stream, readSpaceOptimizedUInt16, ClientPeerInfo.read),
		);
	}

	static write(stream: Writable, infos: ClientsPeerInfo) {
		writeUtf8String(stream, infos.serverUsername);
		writeSmallProgress(stream, infos.mapSavingProgress);
		writeArray(stream, infos.savingFor, writeSpaceOptimizedUInt16, writeSpaceOptimizedUInt16);
		writeMap(stream, infos.clientPeerInfo, writeSpaceOptimizedUInt16, ClientPeerInfo.write);
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
	UserBannedByAuthServer,
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
		public maxUpdatesPerSecond: number,
		public gameID: number,
		public steamID: Buffer,
		public clientsPeerInfo: ClientsPeerInfo,
		public firstSequenceNumberToExpect: number,
		public firstSequenceNumberToSend: number,
		public newPeerID: number,
		public activeMods: ModID[],
		public startupModSettings: PropertyTree,
		public pausedBy: number,
	) { }

	static read(stream: Readable) {
		return new ConnectionAcceptOrDeny(
			readUInt32(stream),
			readUInt8(stream),
			readUtf8String(stream),
			readUtf8String(stream),
			readUtf8String(stream),
			readUInt8(stream),
			readSpaceOptimizedUInt32(stream),
			readUInt32(stream),
			readBuffer(stream, 8),
			ClientsPeerInfo.read(stream),
			readUInt32(stream),
			readUInt32(stream),
			readUInt16(stream),
			readArray(stream, ModID.read),
			PropertyTree.read(stream),
			readUInt16(stream),
		);
	}

	static write(stream: Writable, message: ConnectionAcceptOrDeny) {
		writeUInt32(stream, message.connectionRequestIDGeneratedOnClient);
		writeUInt8(stream, message.status);
		writeUtf8String(stream, message.gameName);
		writeUtf8String(stream, message.serverHash);
		writeUtf8String(stream, message.description);
		writeUInt8(stream, message.latency);
		writeSpaceOptimizedUInt32(stream, message.maxUpdatesPerSecond);
		writeUInt32(stream, message.gameID);
		writeBuffer(stream, message.steamID);
		ClientsPeerInfo.write(stream, message.clientsPeerInfo);
		writeUInt32(stream, message.firstSequenceNumberToExpect);
		writeUInt32(stream, message.firstSequenceNumberToSend);
		writeUInt16(stream, message.newPeerID);
		writeArray(stream, message.activeMods, ModID.write);
		PropertyTree.write(stream, message.startupModSettings);
		writeUInt16(stream, message.pausedBy);
	}
}


export class TickClosure {
	constructor(
		public updateTick: number,
		public inputActions: InputAction[],
		public inputActionSegments: InputActionSegment[],
	) { }

	static read(stream: Readable, isEmpty: boolean) {
		const updateTick = readUInt32(stream);
		if (isEmpty) {
			return new TickClosure(
				updateTick,
				[],
				[],
			);
		}

		const flags = readSpaceOptimizedUInt32(stream)
		const hasInputActionSegments = Boolean(flags & 0x1);
		const inputActionCount = flags >> 1;
		const inputActions = [];

		let lastPlayerIndex = 0xffff;
		for (let i = 0; i < inputActionCount; i++) {
			const action = InputAction.read(stream, lastPlayerIndex);
			lastPlayerIndex = action.playerIndex!;
			inputActions.push(action);
		}

		let inputActionSegments: InputActionSegment[] = [];
		if (hasInputActionSegments) {
			inputActionSegments = readArray(stream, InputActionSegment.read);
		}

		return new TickClosure(
			updateTick,
			inputActions,
			inputActionSegments,
		)
	}

	static write(stream: Writable, closure: TickClosure, writeEmpty: boolean) {
		writeUInt32(stream, closure.updateTick);
		if (writeEmpty) {
			return;
		}

		const hasInputActionSegments = closure.inputActionSegments.length > 0;
		const flags = Number(hasInputActionSegments) | closure.inputActions.length << 1;
		writeSpaceOptimizedUInt32(stream, flags);

		let lastPlayerIndex = 0xffff;
		for (let inputAction of closure.inputActions) {
			InputAction.write(stream, inputAction, lastPlayerIndex);
			lastPlayerIndex = inputAction.playerIndex!;
		}

		if (hasInputActionSegments) {
			writeArray(stream, closure.inputActionSegments, InputActionSegment.write);
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

	static read(stream: Readable, isServer: boolean) {
		const flags = readUInt8(stream);
		const hasHeartbeatRequests = Boolean(flags & 0x01);
		const hasTickClosures = Boolean(flags & 0x02);
		const hasSingleTickClosure = Boolean(flags & 0x04);
		const allTickClosuresAreEmpty = Boolean(flags & 0x08);
		const hasSynchronizerActions = Boolean(flags & 0x10);

		const sequenceNumber = readUInt32(stream);
		const tickClosures = [];
		if (hasTickClosures) {
			let count = 1
			if (!hasSingleTickClosure) {
				count = readSpaceOptimizedUInt32(stream);
			}

			for (let i = 0; i < count; i++) {
				tickClosures.push(TickClosure.read(stream, allTickClosuresAreEmpty));
			}
		}

		let nextToReceiveServerTickClosure = null;
		if (!isServer) {
			nextToReceiveServerTickClosure = readUInt32(stream);
		}

		let synchronizerActions: SynchronizerAction[] = [];
		if (hasSynchronizerActions) {
			synchronizerActions = readArray(stream,
				stream => readSynchronizerAction(stream, isServer)
			);
		}

		let requestsForHeartbeat: number[] = [];
		if (hasHeartbeatRequests) {
			requestsForHeartbeat = readArray(stream, readUInt32);
		}

		return new Heartbeat(
			sequenceNumber,
			tickClosures,
			nextToReceiveServerTickClosure,
			synchronizerActions,
			requestsForHeartbeat,
		);
	}

	static write(stream: Writable, heartbeat: Heartbeat, isServer: boolean) {
		const hasHeartbeatRequests = heartbeat.requestsForHeartbeat.length > 0;
		const hasTickClosures = heartbeat.tickClosures.length > 0;
		const hasSingleTickClosure = heartbeat.tickClosures.length == 1;
		const allTickClosuresAreEmpty = hasTickClosures && heartbeat.tickClosures.filter(
			tickClosure => tickClosure.inputActions.length > 0 || tickClosure.inputActionSegments.length > 0
		).length === 0;
		const hasSynchronizerActions = heartbeat.synchronizerActions.length > 0;

		let flags = 0;
		flags |= Number(hasHeartbeatRequests) * 0x01;
		flags |= Number(hasTickClosures) * 0x02;
		flags |= Number(hasSingleTickClosure) * 0x04;
		flags |= Number(allTickClosuresAreEmpty) * 0x08;
		flags |= Number(hasSynchronizerActions) * 0x10;
		writeUInt8(stream, flags);
		writeUInt32(stream, heartbeat.sequenceNumber);

		if (hasTickClosures) {
			if (hasSingleTickClosure) {
				TickClosure.write(stream, heartbeat.tickClosures[0], allTickClosuresAreEmpty);
			} else {
				writeSpaceOptimizedUInt32(stream, heartbeat.tickClosures.length);
				for (let tickClosure of heartbeat.tickClosures) {
					TickClosure.write(stream, tickClosure, allTickClosuresAreEmpty);
				}
			}
		}

		if (!isServer) {
			writeUInt32(stream, heartbeat.nextToReceiveServerTickClosure!);
		}

		if (hasSynchronizerActions) {
			writeArray(stream,
				heartbeat.synchronizerActions,
				(stream, item) => { writeSynchronizerAction(stream, item, isServer); }
			);
		}

		if (hasHeartbeatRequests) {
			writeArray(stream, heartbeat.requestsForHeartbeat, writeUInt32);
		}
	}
}

export class ClientToServerHeartbeat implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.ClientToServerHeartbeat;
	constructor(
		public heartbeat: Heartbeat,
	) { }

	static read(stream: Readable) {
		return new ClientToServerHeartbeat(Heartbeat.read(stream, false));
	}

	static write(stream: Writable, message: ClientToServerHeartbeat) {
		Heartbeat.write(stream, message.heartbeat, false);
	}
}


export class ServerToClientHeartbeat implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.ServerToClientHeartbeat;
	constructor(
		public heartbeat: Heartbeat,
	) { }

	static read(stream: Readable) {
		return new ServerToClientHeartbeat(Heartbeat.read(stream, true));
	}

	static write(stream: Writable, message: ServerToClientHeartbeat) {
		Heartbeat.write(stream, message.heartbeat, true);
	}
}


export class TransferBlockRequest implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.TransferBlockRequest;
	constructor(
		public blockNumber: number,
	) { }

	static read(stream: Readable) {
		return new TransferBlockRequest(readUInt32(stream));
	}

	static write(stream: Writable, message: TransferBlockRequest) {
		writeUInt32(stream, message.blockNumber);
	}
}


export class TransferBlock implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.TransferBlock;
	constructor(
		public blockNumber: number,
		public data: Buffer,
	) { }

	static read(stream: Readable) {
		return new TransferBlock(readUInt32(stream), readBuffer(stream));
	}

	static write(stream: Writable, message: TransferBlock) {
		writeUInt32(stream, message.blockNumber);
		writeBuffer(stream, message.data);
	}

	static blockSize: number = 503;
}


export class Empty implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.Empty;

	static read(stream: Readable) {
		void stream;
		return new Empty();
	}

	static write(stream: Writable, message: Empty) {
		void stream, message;
	}
}

export type NetworkMessage =
	ConnectionRequest |
	ConnectionRequestReply |
	ConnectionRequestReplyConfirm |
	ConnectionAcceptOrDeny |
	ClientToServerHeartbeat |
	ServerToClientHeartbeat |
	TransferBlockRequest |
	TransferBlock |
	Empty
;

export const NetworkMessageTypeToClass = new Map<NetworkMessageType, Streamable<NetworkMessage>>([
	// [NetworkMessageType.Ping, ...],
	// [NetworkMessageType.PingReply, ...],
	[NetworkMessageType.ConnectionRequest, ConnectionRequest],
	[NetworkMessageType.ConnectionRequestReply, ConnectionRequestReply],
	[NetworkMessageType.ConnectionRequestReplyConfirm, ConnectionRequestReplyConfirm],
	[NetworkMessageType.ConnectionAcceptOrDeny, ConnectionAcceptOrDeny],
	[NetworkMessageType.ClientToServerHeartbeat, ClientToServerHeartbeat],
	[NetworkMessageType.ServerToClientHeartbeat, ServerToClientHeartbeat],
	// [NetworkMessageType.GetOwnAddress, ...],
	// [NetworkMessageType.GetOwnAddressReply, ...],
	// [NetworkMessageType.NatPunchRequest, ...],
	// [NetworkMessageType.NatPunch, ...],
	[NetworkMessageType.TransferBlockRequest, TransferBlockRequest],
	[NetworkMessageType.TransferBlock, TransferBlock],
	// [NetworkMessageType.RequestForHeartbeatWhenDisconnecting, RequestForHeartbeatWhenDisconnecting],
	// [NetworkMessageType.LANBroadcast, ...],
	// [NetworkMessageType.GameInformationRequest, ...],
	// [NetworkMessageType.GameInformationRequestReply, ...],
	[NetworkMessageType.Empty, Empty],
]);
