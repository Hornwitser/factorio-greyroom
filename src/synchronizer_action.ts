import { DecodeError, ReadableStream, WritableStream } from "./stream";
import { DisconnectReason, readSmallProgress, writeSmallProgress, SmallProgress } from "./data";


export enum SynchronizerActionType {
	GameEnd,
	PeerDisconnect,
	NewPeerInfo,
	ClientChangedState,
	ClientShouldStartSendingTickClosures,
	MapReadyForDownload,
	MapLoadingProgressUpdate,
	MapSavingProgressUpdate,
	SavingForUpdate,
	MapDownloadingProgressUpdate,
	CatchingUpProgressUpdate,
	PeerDroppingProgressUpdate,
	PlayerDesynced,
	BeginPause,
	EndPause,
	SkippedTickClosure,
	SkippedTickClosureConfirm,
	ChangeLatency,
	IncreasedLatencyConfirm,
	SavingCountDown,
	AuxiliaryDataReadyForDownload,
	AuxiliaryDataDownloadFinished,
}


export abstract class AbstractSynchronizerAction {
	abstract type: SynchronizerActionType;
	abstract write(stream: WritableStream, isServer: boolean): void
}


export class GameEnd implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.GameEnd;
	constructor(
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new GameEnd(
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class PeerDisconnect implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.PeerDisconnect;
	constructor(
		public reason: DisconnectReason,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new PeerDisconnect(
			stream.readUInt8(),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		stream.writeUInt8(this.reason);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class NewPeerInfo implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.NewPeerInfo;
	constructor(
		public username: string,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new NewPeerInfo(
			stream.readUtf8String(),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		stream.writeUtf8String(this.username);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export enum ClientMultiplayerStateType {
	Ready,
	Connecting,
	ConnectedWaitingForMap,
	ConnectedDownloadingMap,
	ConnectedLoadingMap,
	TryingToCatchUp,
	WaitingForCommandToStartSendingTickClosures,
	InGame,
	DisconnectScheduled,
	WaitingForDisconnectConfirmation,
	WaitingForUserToSaveOrQuitAfterServerLeft,
	Disconnected,
	Failed,
	InitializationFailed,
	DesyncedWaitingForMap,
	DesyncedCatchingUpWithMapReadyForDownload,
	DesyncedSavingLocalVariantOfMap,
	DesyncedDownloadingMap,
	DesyncedCreatingReport,
	InGameSavingMap,
}


export class ClientChangedState implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.ClientChangedState;
	constructor(
		public newState: ClientMultiplayerStateType,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new ClientChangedState(
			stream.readUInt8(),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		stream.writeUInt8(this.newState);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class ClientShouldStartSendingTickClosures implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.ClientShouldStartSendingTickClosures;
	constructor(
		public firstExpectedTickClosureTick: number,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new ClientShouldStartSendingTickClosures(
			stream.readUInt32(),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		stream.writeUInt32(this.firstExpectedTickClosureTick);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export enum GameActionType {
	Nothing,
	GameCreatedFromScenario,
	ShowNextDialog,
	PlayerMinedTile,
	PlayerBuiltTile,
	RobotBuiltTile,
	RobotMinedTile,
	GuiTextChanged,
	EntityRenamed,
	ConsoleChat,
	ConsoleCommand,
	PlayerBanned,
	PlayerUnBanned,
	PlayerKicked,
	PlayerPlacedEquipment,
	PlayerRemovedEquipment,
	GuiOpened,
	GuiClosed,
	PlayerPipette,
	PlayerRotatedEntity,
	ModItemOpened,
	ChunkCharted,
	ForcesMerging,
	ForcesMerged,
	TrainChangedState,
	TrainScheduleChanged,
	ChunkDeleted,
	PreChunkDeleted,
	SurfaceImported,
	SurfaceRenamed,
	ChartTagAdded,
	ChartTagModified,
	ChartTagRemoved,
	LuaShortcut,
	PostEntityDied,
	StringTranslated,
	ScriptTriggerEffect,
	PreScriptInventoryResized,
	ScriptInventoryResized,
	ScriptSetTiles,
	PlayerRespawned,
	RocketLaunched,
	RocketLaunchOrdered,
	PlayerPickedUpItem,
	PlayerBuiltEntity,
	EntityDied,
	EntityDamaged,
	SectorScanned,
	PrePlayerMinedEntity,
	PlayerMinedItem,
	PlayerMinedEntity,
	ResearchStarted,
	ResearchFinished,
	ResearchReversed,
	FirstLabCreated,
	TechnologyEffectsReset,
	ForceReset,
	ChunkGenerated,
	PlayerCraftedItem,
	PrePlayerCraftedItem,
	PlayerCancelledCrafting,
	RobotBuiltEntity,
	PreRobotMinedEntity,
	PreRobotExplodedCliff,
	RobotExplodedCliff,
	RobotMinedItem,
	RobotMinedEntity,
	EntityMarkedForDeconstruction,
	EntityDeconstructionCanceled,
	EntityMarkedForUpgrade,
	EntityUpgradeCanceled,
	PreGhostDeconstructed,
	TriggerCreatedEntity,
	TriggerFiredArtillery,
	EntitySpawned,
	TrainCreated,
	DisplayResolutionChanged,
	DisplayScaleChanged,
	PlayerCreated,
	PlayerChangedPosition,
	ResourceDepleted,
	PlayerDrivingChangedState,
	ForceCreated,
	PlayerCursorStackChanged,
	PlayerQuickBarChanged,
	PlayerMainInventoryChanged,
	PlayerArmorInventoryChanged,
	PlayerAmmoInventoryChanged,
	PlayerGunInventoryChanged,
	PlayerTrashInventoryChanged,
	PreEntitySettingsPasted,
	EntitySettingsPasted,
	PrePlayerDied,
	PlayerDied,
	PlayerLeftGame,
	PlayerJoinedGame,
	GuiCheckedStateChanged,
	PlayerChangedSurface,
	SelectedEntityChanged,
	MarketOfferPurchased,
	PlayerDroppedItem,
	PlayerRepairedEntity,
	PlayerFastEntityTransferred,
	BiterBaseBuilt,
	PlayerChangedForce,
	GuiSelectionStateChanged,
	GuiSelectedTabChanged,
	RuntimeModSettingChanged,
	DifficultySettingsChanged,
	SurfaceCreated,
	SurfaceDeleted,
	PreSurfaceDeleted,
	PreSurfaceCleared,
	SurfaceCleared,
	GuiElemChanged,
	GuiLocationChanged,
	GuiValueChanged,
	GuiSwitchStateChanged,
	GuiClick,
	GuiConfirmed,
	BlueprintSelectArea,
	DeconstructionPlannerSelectArea,
	PlayerConfiguredBlueprint,
	PrePlayerRemoved,
	PlayerRemoved,
	PlayerUsedCapsule,
	PlayerToggledAltMode,
	PlayerPromoted,
	PlayerDemoted,
	PlayerMuted,
	PlayerUnmuted,
	PlayerCheatModeEnabled,
	PlayerCheatModeDisabled,
	PlayerToggledMapEditor,
	PrePlayerToggledMapEditor,
	CutsceneCancelled,
	CombatRobotExpired,
	LandMineArmed,
	CharacterCorpseExpired,
	SpiderCommandCompleted,
	PrePlayerLeftGame,
	ScriptPathRequestFinished,
	ScriptBuiltEntity,
	ScriptDestroyedEntity,
	ScriptRevivedEntity,
	AICommandCompleted,
	EntityCloned,
	AreaCloned,
	BrushCloned,
	OnPreBuild,
	CustomInput,
	SelectArea,
	AltSelectArea,
	CutsceneWaypointReached,
	UnitGroupCreated,
	UnitAddedToGroup,
	UnitGroupFinishedGathering,
	UnitRemovedFromGroup,
	BuildBaseArrived,
	ForceFriendsChanged,
	ForceCeaseFireChanged,
	EntityDestroyed,
	PlayerClickedGpsTag,
	PlayerFlushedFluid,
	PermissionGroupEdited,
	PrePermissionsStringImported,
	PermissionsStringImported,
	PrePermissionGroupDeleted,
	PermissionGroupDeleted,
	PermissionGroupAdded,
	PlayerConfiguredSpiderRemote,
	PlayerUsedSpiderRemote,
	EntityLogisticSlotChanged,
}

export class ScriptRegistration {
	constructor(
		public standardEvents: GameActionType[],
		public nthTickEvents: number[],
		public standardEventFilters: [number, number][],
		public onInit: boolean,
		public onLoad: boolean,
		public onConfigurationChanged: boolean,
	) { }

	static read(stream: ReadableStream) {
		return new ScriptRegistration(
			stream.readArray(stream => stream.readUInt32()),
			stream.readArray(stream => stream.readUInt32()),
			stream.readArray(stream => [stream.readUInt32(), stream.readUInt32()]),
			stream.readBool(),
			stream.readBool(),
			stream.readBool(),
		);
	}

	write(stream: WritableStream) {
		stream.writeArray(this.standardEvents, (item, stream) => { stream.writeUInt32(item); });
		stream.writeArray(this.nthTickEvents, (item, stream) => { stream.writeUInt32(item); });
		stream.writeArray(this.standardEventFilters, (item, stream) => {
			stream.writeUInt32(item[0]);
			stream.writeUInt32(item[1]);
		});
		stream.writeBool(this.onInit);
		stream.writeBool(this.onLoad);
		stream.writeBool(this.onConfigurationChanged);
	}
}

export class MapReadyForDownload implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.MapReadyForDownload;
	constructor(
		public size: number,
		public crc: number,
		public updateTick: number,
		public autosaveInterval: number,
		public autosaveSlots: number,
		public autosaveOnlyOnServer: boolean,
		public nonBlockingSaving: boolean,
		public scriptChecksums: Map<string, number>,
		public scriptEvents: Map<string, ScriptRegistration>,
		public scriptCommands: Map<string, string[]>,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new MapReadyForDownload(
			stream.readUInt32(),
			stream.readUInt32(),
			stream.readUInt32(),
			stream.readUInt32(),
			stream.readUInt32(),
			stream.readBool(),
			stream.readBool(),
			stream.readMap(
				stream => stream.readUtf8String(),
				stream => stream.readUInt32(),
			),
			stream.readMap(
				stream => stream.readUtf8String(),
				stream => ScriptRegistration.read(stream),
			),
			stream.readMap(
				stream => stream.readUtf8String(),
				stream => stream.readArray(stream => stream.readUtf8String()),
			),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		stream.writeUInt32(this.size);
		stream.writeUInt32(this.crc);
		stream.writeUInt32(this.updateTick);
		stream.writeUInt32(this.autosaveInterval);
		stream.writeUInt32(this.autosaveSlots);
		stream.writeBool(this.autosaveOnlyOnServer);
		stream.writeBool(this.nonBlockingSaving);
		stream.writeMap(
			this.scriptChecksums,
			(key, stream) => { stream.writeUtf8String(key); },
			(value, stream) => { stream.writeUInt32(value); },
		),
		stream.writeMap(
			this.scriptEvents,
			(key, stream) => { stream.writeUtf8String(key); },
		),
		stream.writeMap(
			this.scriptCommands,
			(key, stream) => { stream.writeUtf8String(key); },
			(value, stream) => {
				stream.writeArray(value, (item, stream) => stream.writeUtf8String(item));
			},
		);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class MapLoadingProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.MapLoadingProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new MapLoadingProgressUpdate(
			readSmallProgress(stream),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		writeSmallProgress(this.progress, stream);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class MapSavingProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.MapSavingProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new MapSavingProgressUpdate(
			readSmallProgress(stream),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		writeSmallProgress(this.progress, stream);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class SavingForUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.SavingForUpdate;
	constructor(
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new SavingForUpdate(
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class MapDownloadingProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.MapDownloadingProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new MapDownloadingProgressUpdate(
			readSmallProgress(stream),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		writeSmallProgress(this.progress, stream);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class CatchingUpProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.CatchingUpProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new CatchingUpProgressUpdate(
			readSmallProgress(stream),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		writeSmallProgress(this.progress, stream);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class PeerDroppingProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.PeerDroppingProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new PeerDroppingProgressUpdate(
			readSmallProgress(stream),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		writeSmallProgress(this.progress, stream);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class PlayerDesynced implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.PlayerDesynced;
	constructor(
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new PlayerDesynced(
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class BeginPause implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.BeginPause;
	constructor(
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new BeginPause(
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class EndPause implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.EndPause;
	constructor(
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new EndPause(
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class ChangeLatency implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.ChangeLatency;
	constructor(
		public latency: number,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new ChangeLatency(
			stream.readUInt8(),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		stream.writeUInt8(this.latency);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class IncreasedLatencyConfirm implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.IncreasedLatencyConfirm;
	constructor(
		public firstTickToSkip: number,
		public ticksToSkip: number,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new IncreasedLatencyConfirm(
			stream.readUInt32(),
			stream.readUInt8(),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		stream.writeUInt32(this.firstTickToSkip);
		stream.writeUInt8(this.ticksToSkip);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class SavingCountDown implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.SavingCountDown;
	constructor(
		public ticksToFinish: number,
		public playersInQueue: number,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new SavingCountDown(
			stream.readUInt32(),
			stream.readUInt32(),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		stream.writeUInt32(this.ticksToFinish);
		stream.writeUInt32(this.playersInQueue);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class AuxiliaryDataReadyForDownload implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.AuxiliaryDataReadyForDownload;
	constructor(
		public size: number,
		public crc: number,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new AuxiliaryDataReadyForDownload(
			stream.readUInt32(),
			stream.readUInt32(),
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		stream.writeUInt32(this.size);
		stream.writeUInt32(this.crc);
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export class AuxiliaryDataDownloadFinished implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.AuxiliaryDataDownloadFinished;
	constructor(
		public peerID?: number,
	) { }

	static read(stream: ReadableStream, isServer: boolean) {
		return new AuxiliaryDataDownloadFinished(
			isServer ? stream.readUInt16() : undefined,
		);
	}

	write(stream: WritableStream, isServer: boolean) {
		if (isServer) {
			stream.writeUInt16(this.peerID!);
		}
	}
}


export type SynchronizerAction =
	GameEnd |
	PeerDisconnect |
	NewPeerInfo |
	ClientChangedState |
	ClientShouldStartSendingTickClosures |
	MapReadyForDownload |
	MapLoadingProgressUpdate |
	MapSavingProgressUpdate |
	SavingForUpdate |
	MapDownloadingProgressUpdate |
	CatchingUpProgressUpdate |
	PeerDroppingProgressUpdate |
	PlayerDesynced |
	BeginPause |
	EndPause |
	ChangeLatency |
	IncreasedLatencyConfirm |
	SavingCountDown |
	AuxiliaryDataReadyForDownload |
	AuxiliaryDataDownloadFinished
;

export interface SynchronizerActionClass {
	read(stream: ReadableStream, isServer: boolean): SynchronizerAction;
}

export const SynchronizerActionTypeToClass = new Map<SynchronizerActionType, SynchronizerActionClass>([
	[SynchronizerActionType.GameEnd, GameEnd],
	[SynchronizerActionType.PeerDisconnect, PeerDisconnect],
	[SynchronizerActionType.NewPeerInfo, NewPeerInfo],
	[SynchronizerActionType.ClientChangedState, ClientChangedState],
	[SynchronizerActionType.ClientShouldStartSendingTickClosures, ClientShouldStartSendingTickClosures],
	[SynchronizerActionType.MapReadyForDownload, MapReadyForDownload],
	[SynchronizerActionType.MapLoadingProgressUpdate, MapLoadingProgressUpdate],
	[SynchronizerActionType.MapSavingProgressUpdate, MapSavingProgressUpdate],
	[SynchronizerActionType.SavingForUpdate, SavingForUpdate],
	[SynchronizerActionType.MapDownloadingProgressUpdate, MapDownloadingProgressUpdate],
	[SynchronizerActionType.CatchingUpProgressUpdate, CatchingUpProgressUpdate],
	[SynchronizerActionType.PeerDroppingProgressUpdate, PeerDroppingProgressUpdate],
	[SynchronizerActionType.PlayerDesynced, PlayerDesynced],
	[SynchronizerActionType.BeginPause, BeginPause],
	[SynchronizerActionType.EndPause, EndPause],
	// [SynchronizerActionType.SkippedTickClosure, SkippedTickClosure],
	// [SynchronizerActionType.SkippedTickClosureConfirm, SkippedTickClosureConfirm],
	[SynchronizerActionType.ChangeLatency, ChangeLatency],
	[SynchronizerActionType.IncreasedLatencyConfirm, IncreasedLatencyConfirm],
	[SynchronizerActionType.SavingCountDown, SavingCountDown],
	[SynchronizerActionType.AuxiliaryDataReadyForDownload, AuxiliaryDataReadyForDownload],
	[SynchronizerActionType.AuxiliaryDataDownloadFinished, AuxiliaryDataDownloadFinished],
]);

export function readSynchronizerAction(stream: ReadableStream, isServer: boolean): SynchronizerAction {
	const type: SynchronizerActionType = stream.readUInt8();
	const synchronizerClass = SynchronizerActionTypeToClass.get(type);
	if (!synchronizerClass) {
		throw new DecodeError(
			`Undecoded SynchronizerAction type ${SynchronizerActionType[type]} (${type})`,
			{ stream, synchronizerActionType: type }
		);
	}
	return synchronizerClass.read(stream, isServer) as SynchronizerAction;
}

export function writeSynchronizerAction(
	synchronizerAction: SynchronizerAction,
	stream: WritableStream,
	isServer: boolean
) {
	stream.writeUInt8(synchronizerAction.type);
	synchronizerAction.write(stream, isServer);
}

