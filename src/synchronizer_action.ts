import {
	DecodeError, Readable, EncodeError, Writable, Duplexer,
	Bool, UInt8, UInt16, UInt32, Utf8String, ArrayT, MapT,
} from "./stream";
import { DisconnectReason, SmallProgress } from "./data";


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
	abstract peerID?: UInt16;
}


export class GameEnd implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.GameEnd;
	constructor(
		public peerID?: UInt16,
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
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new PeerDisconnect(
			UInt8.read(stream),
		);
	}

	static write(stream: Writable, action: PeerDisconnect) {
		UInt8.write(stream, action.reason);
	}
}


export class NewPeerInfo implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.NewPeerInfo;
	constructor(
		public username: string,
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new NewPeerInfo(
			Utf8String.read(stream),
		);
	}

	static write(stream: Writable, action: NewPeerInfo) {
		Utf8String.write(stream, action.username);
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
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new ClientChangedState(
			UInt8.read(stream),
		);
	}

	static write(stream: Writable, action: ClientChangedState) {
		UInt8.write(stream, action.newState);
	}
}


export class ClientShouldStartSendingTickClosures implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.ClientShouldStartSendingTickClosures;
	constructor(
		public firstExpectedTickClosureTick: UInt32,
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new ClientShouldStartSendingTickClosures(
			UInt32.read(stream),
		);
	}

	static write(stream: Writable, action: ClientShouldStartSendingTickClosures) {
		UInt32.write(stream, action.firstExpectedTickClosureTick);
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
		public nthTickEvents: UInt32[],
		public standardEventFilters: [UInt32, UInt32][],
		public onInit: boolean,
		public onLoad: boolean,
		public onConfigurationChanged: boolean,
	) { }

	static read(stream: Readable) {
		return new ScriptRegistration(
			ArrayT.read(stream, UInt32.read),
			ArrayT.read(stream, UInt32.read),
			ArrayT.read(stream, stream => [UInt32.read(stream), UInt32.read(stream)]),
			Bool.read(stream),
			Bool.read(stream),
			Bool.read(stream),
		);
	}

	static write(stream: Writable, reg: ScriptRegistration) {
		ArrayT.write(stream, reg.standardEvents, UInt32.write);
		ArrayT.write(stream, reg.nthTickEvents, UInt32.write);
		ArrayT.write(stream, reg.standardEventFilters, (stream, item) => {
			UInt32.write(stream, item[0]);
			UInt32.write(stream, item[1]);
		});
		Bool.write(stream, reg.onInit);
		Bool.write(stream, reg.onLoad);
		Bool.write(stream, reg.onConfigurationChanged);
	}
}

export class MapReadyForDownload implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.MapReadyForDownload;
	constructor(
		public size: UInt32,
		public auxiliarySize: UInt32,
		public crc: UInt32,
		public updateTick: UInt32,
		public autosaveInterval: UInt32,
		public autosaveSlots: UInt32,
		public autosaveOnlyOnServer: Bool,
		public nonBlockingSaving: Bool,
		public scriptChecksums: Map<Utf8String, UInt32>,
		public scriptEvents: Map<Utf8String, ScriptRegistration>,
		public scriptCommands: Map<Utf8String, Utf8String[]>,
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new MapReadyForDownload(
			UInt32.read(stream),
			UInt32.read(stream),
			UInt32.read(stream),
			UInt32.read(stream),
			UInt32.read(stream),
			UInt32.read(stream),
			Bool.read(stream),
			Bool.read(stream),
			MapT.read(stream, Utf8String.read, UInt32.read),
			MapT.read(stream, Utf8String.read, ScriptRegistration.read),
			MapT.read(stream, Utf8String.read,
				stream => ArrayT.read(stream, Utf8String.read),
			),
		);
	}

	static write(stream: Writable, action: MapReadyForDownload) {
		UInt32.write(stream, action.size);
		UInt32.write(stream, action.auxiliarySize);
		UInt32.write(stream, action.crc);
		UInt32.write(stream, action.updateTick);
		UInt32.write(stream, action.autosaveInterval);
		UInt32.write(stream, action.autosaveSlots);
		Bool.write(stream, action.autosaveOnlyOnServer);
		Bool.write(stream, action.nonBlockingSaving);
		MapT.write(stream, action.scriptChecksums, Utf8String.write, UInt32.write),
		MapT.write(stream, action.scriptEvents, Utf8String.write, ScriptRegistration.write),
		MapT.write(stream,
			action.scriptCommands,
			Utf8String.write,
			(stream, value) => {
				ArrayT.write(stream, value, Utf8String.write);
			},
		);
	}
}


export class MapLoadingProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.MapLoadingProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new MapLoadingProgressUpdate(
			SmallProgress.read(stream),
		);
	}

	static write(stream: Writable, action: MapLoadingProgressUpdate) {
		SmallProgress.write(stream, action.progress);
	}
}


export class MapSavingProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.MapSavingProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new MapSavingProgressUpdate(
			SmallProgress.read(stream),
		);
	}

	static write(stream: Writable, action: MapSavingProgressUpdate) {
		SmallProgress.write(stream, action.progress);
	}
}


export class SavingForUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.SavingForUpdate;
	constructor(
		public peerID?: UInt16,
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
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new MapDownloadingProgressUpdate(
			SmallProgress.read(stream),
		);
	}

	static write(stream: Writable, action: MapDownloadingProgressUpdate) {
		SmallProgress.write(stream, action.progress);
	}
}


export class CatchingUpProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.CatchingUpProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new CatchingUpProgressUpdate(
			SmallProgress.read(stream),
		);
	}

	static write(stream: Writable, action: CatchingUpProgressUpdate) {
		SmallProgress.write(stream, action.progress);
	}
}


export class PeerDroppingProgressUpdate implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.PeerDroppingProgressUpdate;
	constructor(
		public progress: SmallProgress,
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new PeerDroppingProgressUpdate(
			SmallProgress.read(stream),
		);
	}

	static write(stream: Writable, action: PeerDroppingProgressUpdate) {
		SmallProgress.write(stream, action.progress);
	}
}


export class PlayerDesynced implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.PlayerDesynced;
	constructor(
		public peerID?: UInt16,
	) { }

	static read() {
		return new PlayerDesynced();
	}

	static write() { }
}


export class BeginPause implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.BeginPause;
	constructor(
		public peerID?: UInt16,
	) { }

	static read() {
		return new BeginPause();
	}

	static write() { }
}


export class EndPause implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.EndPause;
	constructor(
		public peerID?: UInt16,
	) { }

	static read() {
		return new EndPause();
	}

	static write() { }
}


export class ChangeLatency implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.ChangeLatency;
	constructor(
		public latency: UInt8,
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new ChangeLatency(
			UInt8.read(stream),
		);
	}

	static write(stream: Writable, action: ChangeLatency) {
		UInt8.write(stream, action.latency);
	}
}


export class IncreasedLatencyConfirm implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.IncreasedLatencyConfirm;
	constructor(
		public firstTickToSkip: UInt32,
		public ticksToSkip: UInt8,
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new IncreasedLatencyConfirm(
			UInt32.read(stream),
			UInt8.read(stream),
		);
	}

	static write(stream: Writable, action: IncreasedLatencyConfirm) {
		UInt32.write(stream, action.firstTickToSkip);
		UInt8.write(stream, action.ticksToSkip);
	}
}


export class SavingCountDown implements AbstractSynchronizerAction {
	readonly type = SynchronizerActionType.SavingCountDown;
	constructor(
		public ticksToFinish: UInt32,
		public playersInQueue: UInt32,
		public peerID?: UInt16,
	) { }

	static read(stream: Readable) {
		return new SavingCountDown(
			UInt32.read(stream),
			UInt32.read(stream),
		);
	}

	static write(stream: Writable, action: SavingCountDown) {
		UInt32.write(stream, action.ticksToFinish);
		UInt32.write(stream, action.playersInQueue);
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

export const SynchronizerActionTypeToClass = new Map<SynchronizerActionType, Duplexer<SynchronizerAction>>([
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

export function readSynchronizerAction(stream: Readable, isServer: boolean): SynchronizerAction {
	const type: SynchronizerActionType = UInt8.read(stream);
	const synchronizerClass = SynchronizerActionTypeToClass.get(type);
	if (!synchronizerClass) {
		throw new DecodeError(
			`Undecoded SynchronizerAction type ${SynchronizerActionType[type]} (${type})`,
			{ stream, synchronizerActionType: type }
		);
	}
	const action = synchronizerClass.read(stream);
	if (isServer) {
		action.peerID = UInt16.read(stream);
	}
	return action;
}

export function writeSynchronizerAction(
	stream: Writable,
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
	UInt8.write(stream, type);
	synchronizerClass.write(stream, synchronizerAction);
	if (isServer) {
		UInt16.write(stream, synchronizerAction.peerID!);
	}
}
