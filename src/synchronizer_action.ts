import {
	DecodeError, ReadableStream, EncodeError, WritableStream, Streamable,
	readBool, readUInt8, readUInt16, readUInt32, readUtf8String, readArray, readMap,
	writeBool, writeUInt8, writeUInt16, writeUInt32, writeUtf8String, writeArray, writeMap,
} from "./stream";
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
}


export abstract class AbstractSynchronizerAction {
	abstract type: SynchronizerActionType;
	abstract peerID?: number;
}


export class GameEnd implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.GameEnd;
	constructor(
		public peerID?: number,
	) { }

	static read() {
		return new GameEnd();
	}

	static write() { }
}


export class PeerDisconnect implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.PeerDisconnect;
	constructor(
		public reason: DisconnectReason,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream) {
		return new PeerDisconnect(
			readUInt8(stream),
		);
	}

	static write(stream: WritableStream, action: PeerDisconnect) {
		writeUInt8(stream, action.reason);
	}
}


export class NewPeerInfo implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.NewPeerInfo;
	constructor(
		public username: string,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream) {
		return new NewPeerInfo(
			readUtf8String(stream),
		);
	}

	static write(stream: WritableStream, action: NewPeerInfo) {
		writeUtf8String(stream, action.username);
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

	static read(stream: ReadableStream) {
		return new ClientChangedState(
			readUInt8(stream),
		);
	}

	static write(stream: WritableStream, action: ClientChangedState) {
		writeUInt8(stream, action.newState);
	}
}


export class ClientShouldStartSendingTickClosures implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.ClientShouldStartSendingTickClosures;
	constructor(
		public firstExpectedTickClosureTick: number,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream) {
		return new ClientShouldStartSendingTickClosures(
			readUInt32(stream),
		);
	}

	static write(stream: WritableStream, action: ClientShouldStartSendingTickClosures) {
		writeUInt32(stream, action.firstExpectedTickClosureTick);
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
			readArray(stream, readUInt32),
			readArray(stream, readUInt32),
			readArray(stream, stream => [readUInt32(stream), readUInt32(stream)]),
			readBool(stream),
			readBool(stream),
			readBool(stream),
		);
	}

	static write(stream: WritableStream, reg: ScriptRegistration) {
		writeArray(stream, reg.standardEvents, writeUInt32);
		writeArray(stream, reg.nthTickEvents, writeUInt32);
		writeArray(stream, reg.standardEventFilters, (stream, item) => {
			writeUInt32(stream, item[0]);
			writeUInt32(stream, item[1]);
		});
		writeBool(stream, reg.onInit);
		writeBool(stream, reg.onLoad);
		writeBool(stream, reg.onConfigurationChanged);
	}
}

export class MapReadyForDownload implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.MapReadyForDownload;
	constructor(
		public size: number,
		public auxiliarySize: number,
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

	static read(stream: ReadableStream) {
		return new MapReadyForDownload(
			readUInt32(stream),
			readUInt32(stream),
			readUInt32(stream),
			readUInt32(stream),
			readUInt32(stream),
			readUInt32(stream),
			readBool(stream),
			readBool(stream),
			readMap(stream, readUtf8String, readUInt32),
			readMap(stream, readUtf8String, ScriptRegistration.read),
			readMap(stream, readUtf8String,
				stream => readArray(stream, readUtf8String),
			),
		);
	}

	static write(stream: WritableStream, action: MapReadyForDownload) {
		writeUInt32(stream, action.size);
		writeUInt32(stream, action.auxiliarySize);
		writeUInt32(stream, action.crc);
		writeUInt32(stream, action.updateTick);
		writeUInt32(stream, action.autosaveInterval);
		writeUInt32(stream, action.autosaveSlots);
		writeBool(stream, action.autosaveOnlyOnServer);
		writeBool(stream, action.nonBlockingSaving);
		writeMap(stream, action.scriptChecksums, writeUtf8String, writeUInt32),
		writeMap(stream, action.scriptEvents, writeUtf8String, ScriptRegistration.write),
		writeMap(stream,
			action.scriptCommands,
			writeUtf8String,
			(stream, value) => {
				writeArray(stream, value, writeUtf8String);
			},
		);
	}
}


export class MapLoadingProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.MapLoadingProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream) {
		return new MapLoadingProgressUpdate(
			readSmallProgress(stream),
		);
	}

	static write(stream: WritableStream, action: MapLoadingProgressUpdate) {
		writeSmallProgress(stream, action.progress);
	}
}


export class MapSavingProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.MapSavingProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream) {
		return new MapSavingProgressUpdate(
			readSmallProgress(stream),
		);
	}

	static write(stream: WritableStream, action: MapSavingProgressUpdate) {
		writeSmallProgress(stream, action.progress);
	}
}


export class SavingForUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.SavingForUpdate;
	constructor(
		public peerID?: number,
	) { }

	static read() {
		return new SavingForUpdate();
	}

	static write() { }
}


export class MapDownloadingProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.MapDownloadingProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream) {
		return new MapDownloadingProgressUpdate(
			readSmallProgress(stream),
		);
	}

	static write(stream: WritableStream, action: MapDownloadingProgressUpdate) {
		writeSmallProgress(stream, action.progress);
	}
}


export class CatchingUpProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.CatchingUpProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream) {
		return new CatchingUpProgressUpdate(
			readSmallProgress(stream),
		);
	}

	static write(stream: WritableStream, action: CatchingUpProgressUpdate) {
		writeSmallProgress(stream, action.progress);
	}
}


export class PeerDroppingProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.PeerDroppingProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream) {
		return new PeerDroppingProgressUpdate(
			readSmallProgress(stream),
		);
	}

	static write(stream: WritableStream, action: PeerDroppingProgressUpdate) {
		writeSmallProgress(stream, action.progress);
	}
}


export class PlayerDesynced implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.PlayerDesynced;
	constructor(
		public peerID?: number,
	) { }

	static read() {
		return new PlayerDesynced();
	}

	static write() { }
}


export class BeginPause implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.BeginPause;
	constructor(
		public peerID?: number,
	) { }

	static read() {
		return new BeginPause();
	}

	static write() { }
}


export class EndPause implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.EndPause;
	constructor(
		public peerID?: number,
	) { }

	static read() {
		return new EndPause();
	}

	static write() { }
}


export class ChangeLatency implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.ChangeLatency;
	constructor(
		public latency: number,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream) {
		return new ChangeLatency(
			readUInt8(stream),
		);
	}

	static write(stream: WritableStream, action: ChangeLatency) {
		writeUInt8(stream, action.latency);
	}
}


export class IncreasedLatencyConfirm implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.IncreasedLatencyConfirm;
	constructor(
		public firstTickToSkip: number,
		public ticksToSkip: number,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream) {
		return new IncreasedLatencyConfirm(
			readUInt32(stream),
			readUInt8(stream),
		);
	}

	static write(stream: WritableStream, action: IncreasedLatencyConfirm) {
		writeUInt32(stream, action.firstTickToSkip);
		writeUInt8(stream, action.ticksToSkip);
	}
}


export class SavingCountDown implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.SavingCountDown;
	constructor(
		public ticksToFinish: number,
		public playersInQueue: number,
		public peerID?: number,
	) { }

	static read(stream: ReadableStream) {
		return new SavingCountDown(
			readUInt32(stream),
			readUInt32(stream),
		);
	}

	static write(stream: WritableStream, action: SavingCountDown) {
		writeUInt32(stream, action.ticksToFinish);
		writeUInt32(stream, action.playersInQueue);
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
	SavingCountDown
;

export const SynchronizerActionTypeToClass = new Map<SynchronizerActionType, Streamable<SynchronizerAction>>([
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
]);

export function readSynchronizerAction(stream: ReadableStream, isServer: boolean): SynchronizerAction {
	const type: SynchronizerActionType = readUInt8(stream);
	const synchronizerClass = SynchronizerActionTypeToClass.get(type);
	if (!synchronizerClass) {
		throw new DecodeError(
			`Undecoded SynchronizerAction type ${SynchronizerActionType[type]} (${type})`,
			{ stream, synchronizerActionType: type }
		);
	}
	const action = synchronizerClass.read(stream);
	if (isServer) {
		action.peerID = readUInt16(stream);
	}
	return action;
}

export function writeSynchronizerAction(
	stream: WritableStream,
	synchronizerAction: SynchronizerAction,
	isServer: boolean
) {
	const type = synchronizerAction.type;
	const synchronizerClass = SynchronizerActionTypeToClass.get(type);
	if (!synchronizerClass) {
		throw new EncodeError(
			`Unencoded SynchronizerAction type ${SynchronizerActionType[type]} (${type})`,
			{ stream, synchronizerActionType: type }
		);
	}
	writeUInt8(stream, type);
	synchronizerClass.write(stream, synchronizerAction);
	if (isServer) {
		writeUInt16(stream, synchronizerAction.peerID!);
	}
}
