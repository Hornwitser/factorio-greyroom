import {
	Readable, Writable, Duplexer,
} from "./stream";
import {
	UInt8, UInt16, UInt32, SpaceOptimizedUInt16, SpaceOptimizedUInt32,
	BufferT, Utf8String, ArrayT, MapT,
} from "./types";
import { InputAction, InputActionSegment } from "./input";
import { Version, ModID, PropertyTree, SmallProgress } from "./data";
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
			UInt32.read(stream),
		);
	}

	static write(stream: Writable, message: ConnectionRequest) {
		Version.write(stream, message.version);
		UInt32.write(stream, message.connectionRequestIDGeneratedOnClient);
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
			UInt32.read(stream),
			UInt32.read(stream),
		);
	}

	static write(stream: Writable, message: ConnectionRequestReply) {
		Version.write(stream, message.version);
		UInt32.write(stream, message.connectionRequestIDGeneratedOnClient);
		UInt32.write(stream, message.connectionRequestIDGeneratedOnServer);
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
			UInt32.read(stream),
			UInt32.read(stream),
			UInt32.read(stream),
			Utf8String.read(stream),
			Utf8String.read(stream),
			Utf8String.read(stream),
			Utf8String.read(stream),
			UInt32.read(stream),
			UInt32.read(stream),
			ArrayT.read(stream, ModID.read),
			PropertyTree.read(stream),
		);
	}

	static write(stream: Writable, message: ConnectionRequestReplyConfirm) {
		UInt32.write(stream, message.connectionRequestIDGeneratedOnClient);
		UInt32.write(stream, message.connectionRequestIDGeneratedOnServer);
		UInt32.write(stream, message.instanceID);
		Utf8String.write(stream, message.username);
		Utf8String.write(stream, message.passwordHash);
		Utf8String.write(stream, message.serverKey);
		Utf8String.write(stream, message.serverKeyTimestamp);
		UInt32.write(stream, message.coreChecksum);
		UInt32.write(stream, message.prototypeListChecksum);
		ArrayT.write(stream, message.activeMods, ModID.write);
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
		const username = Utf8String.read(stream);
		const flags = UInt8.read(stream);
		let droppingProgress = null;
		let mapSavingProgress = null;
		let mapDownloadingProgress = null;
		let mapLoadingProgress = null;
		let tryingToCatchUpProgress = null;
		if (flags & 0x01) { droppingProgress = SmallProgress.read(stream); }
		if (flags & 0x02) { mapSavingProgress = SmallProgress.read(stream); }
		if (flags & 0x04) { mapDownloadingProgress = SmallProgress.read(stream); }
		if (flags & 0x08) { mapLoadingProgress = SmallProgress.read(stream); }
		if (flags & 0x10) { tryingToCatchUpProgress = SmallProgress.read(stream); }
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
		Utf8String.write(stream, info.username);

		let flags = 0;
		if (info.droppingProgress !== null) { flags |= 0x01; }
		if (info.mapSavingProgress !== null) { flags |= 0x02; }
		if (info.mapDownloadingProgress !== null) { flags |= 0x04; }
		if (info.mapLoadingProgress !== null) { flags |= 0x08; }
		if (info.tryingToCatchUpProgress !== null) { flags |= 0x10; }

		UInt8.write(stream, flags);
		if (info.droppingProgress !== null) {
			SmallProgress.write(stream, info.droppingProgress);
		}
		if (info.mapSavingProgress !== null) {
			SmallProgress.write(stream, info.mapSavingProgress);
		}
		if (info.mapDownloadingProgress !== null) {
			SmallProgress.write(stream, info.mapDownloadingProgress);
		}
		if (info.mapLoadingProgress !== null) {
			SmallProgress.write(stream, info.mapLoadingProgress);
		}
		if (info.tryingToCatchUpProgress !== null) {
			SmallProgress.write(stream, info.tryingToCatchUpProgress);
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
			Utf8String.read(stream),
			SmallProgress.read(stream),
			ArrayT.read(stream, SpaceOptimizedUInt16.read, SpaceOptimizedUInt16.read),
			MapT.read(stream, SpaceOptimizedUInt16.read, ClientPeerInfo.read),
		);
	}

	static write(stream: Writable, infos: ClientsPeerInfo) {
		Utf8String.write(stream, infos.serverUsername);
		SmallProgress.write(stream, infos.mapSavingProgress);
		ArrayT.write(stream, infos.savingFor, SpaceOptimizedUInt16.write, SpaceOptimizedUInt16.write);
		MapT.write(stream, infos.clientPeerInfo, SpaceOptimizedUInt16.write, ClientPeerInfo.write);
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
			UInt32.read(stream),
			UInt8.read(stream),
			Utf8String.read(stream),
			Utf8String.read(stream),
			Utf8String.read(stream),
			UInt8.read(stream),
			SpaceOptimizedUInt32.read(stream),
			UInt32.read(stream),
			BufferT.read(stream, 8),
			ClientsPeerInfo.read(stream),
			UInt32.read(stream),
			UInt32.read(stream),
			UInt16.read(stream),
			ArrayT.read(stream, ModID.read),
			PropertyTree.read(stream),
			UInt16.read(stream),
		);
	}

	static write(stream: Writable, message: ConnectionAcceptOrDeny) {
		UInt32.write(stream, message.connectionRequestIDGeneratedOnClient);
		UInt8.write(stream, message.status);
		Utf8String.write(stream, message.gameName);
		Utf8String.write(stream, message.serverHash);
		Utf8String.write(stream, message.description);
		UInt8.write(stream, message.latency);
		SpaceOptimizedUInt32.write(stream, message.maxUpdatesPerSecond);
		UInt32.write(stream, message.gameID);
		BufferT.write(stream, message.steamID);
		ClientsPeerInfo.write(stream, message.clientsPeerInfo);
		UInt32.write(stream, message.firstSequenceNumberToExpect);
		UInt32.write(stream, message.firstSequenceNumberToSend);
		UInt16.write(stream, message.newPeerID);
		ArrayT.write(stream, message.activeMods, ModID.write);
		PropertyTree.write(stream, message.startupModSettings);
		UInt16.write(stream, message.pausedBy);
	}
}


export class TickClosure {
	constructor(
		public updateTick: number,
		public inputActions: InputAction[],
		public inputActionSegments: InputActionSegment[],
	) { }

	static read(stream: Readable, isEmpty: boolean) {
		const updateTick = UInt32.read(stream);
		if (isEmpty) {
			return new TickClosure(
				updateTick,
				[],
				[],
			);
		}

		const flags = SpaceOptimizedUInt32.read(stream)
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
			inputActionSegments = ArrayT.read(stream, InputActionSegment.read);
		}

		return new TickClosure(
			updateTick,
			inputActions,
			inputActionSegments,
		)
	}

	static write(stream: Writable, closure: TickClosure, writeEmpty: boolean) {
		UInt32.write(stream, closure.updateTick);
		if (writeEmpty) {
			return;
		}

		const hasInputActionSegments = closure.inputActionSegments.length > 0;
		const flags = Number(hasInputActionSegments) | closure.inputActions.length << 1;
		SpaceOptimizedUInt32.write(stream, flags);

		let lastPlayerIndex = 0xffff;
		for (let inputAction of closure.inputActions) {
			InputAction.write(stream, inputAction, lastPlayerIndex);
			lastPlayerIndex = inputAction.playerIndex!;
		}

		if (hasInputActionSegments) {
			ArrayT.write(stream, closure.inputActionSegments, InputActionSegment.write);
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
		const flags = UInt8.read(stream);
		const hasHeartbeatRequests = Boolean(flags & 0x01);
		const hasTickClosures = Boolean(flags & 0x02);
		const hasSingleTickClosure = Boolean(flags & 0x04);
		const allTickClosuresAreEmpty = Boolean(flags & 0x08);
		const hasSynchronizerActions = Boolean(flags & 0x10);

		const sequenceNumber = UInt32.read(stream);
		const tickClosures = [];
		if (hasTickClosures) {
			let count = 1
			if (!hasSingleTickClosure) {
				count = SpaceOptimizedUInt32.read(stream);
			}

			for (let i = 0; i < count; i++) {
				tickClosures.push(TickClosure.read(stream, allTickClosuresAreEmpty));
			}
		}

		let nextToReceiveServerTickClosure = null;
		if (!isServer) {
			nextToReceiveServerTickClosure = UInt32.read(stream);
		}

		let synchronizerActions: SynchronizerAction[] = [];
		if (hasSynchronizerActions) {
			synchronizerActions = ArrayT.read(stream,
				stream => readSynchronizerAction(stream, isServer)
			);
		}

		let requestsForHeartbeat: number[] = [];
		if (hasHeartbeatRequests) {
			requestsForHeartbeat = ArrayT.read(stream, UInt32.read);
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
		UInt8.write(stream, flags);
		UInt32.write(stream, heartbeat.sequenceNumber);

		if (hasTickClosures) {
			if (hasSingleTickClosure) {
				TickClosure.write(stream, heartbeat.tickClosures[0], allTickClosuresAreEmpty);
			} else {
				SpaceOptimizedUInt32.write(stream, heartbeat.tickClosures.length);
				for (let tickClosure of heartbeat.tickClosures) {
					TickClosure.write(stream, tickClosure, allTickClosuresAreEmpty);
				}
			}
		}

		if (!isServer) {
			UInt32.write(stream, heartbeat.nextToReceiveServerTickClosure!);
		}

		if (hasSynchronizerActions) {
			ArrayT.write(stream,
				heartbeat.synchronizerActions,
				(stream, item) => { writeSynchronizerAction(stream, item, isServer); }
			);
		}

		if (hasHeartbeatRequests) {
			ArrayT.write(stream, heartbeat.requestsForHeartbeat, UInt32.write);
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
		return new TransferBlockRequest(UInt32.read(stream));
	}

	static write(stream: Writable, message: TransferBlockRequest) {
		UInt32.write(stream, message.blockNumber);
	}
}


export class TransferBlock implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.TransferBlock;
	constructor(
		public blockNumber: number,
		public data: Buffer,
	) { }

	static read(stream: Readable) {
		return new TransferBlock(UInt32.read(stream), BufferT.read(stream));
	}

	static write(stream: Writable, message: TransferBlock) {
		UInt32.write(stream, message.blockNumber);
		BufferT.write(stream, message.data);
	}

	static blockSize: number = 503;
}


export class EmptyMessage implements AbstractNetworkMessage {
	readonly type = NetworkMessageType.Empty;

	static read(stream: Readable) {
		void stream;
		return new EmptyMessage();
	}

	static write(stream: Writable, message: EmptyMessage) {
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
	EmptyMessage
;

export const NetworkMessageTypeToClass = new Map<NetworkMessageType, Duplexer<NetworkMessage>>([
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
	[NetworkMessageType.Empty, EmptyMessage],
]);
