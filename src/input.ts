import {
	DecodeError, Readable, EncodeError, Duplexer, DuplexerLookupTable, Writable,
	Bool, UInt8, UInt16, UInt32, BufferT,
	SpaceOptimizedUInt16, SpaceOptimizedUInt32, StringT, Utf8String,
} from "./stream";
import { Direction, MapPosition, DisconnectReason } from "./data";


export type CrcData = { crc: number, tickOfCrc: number };
export const CrcData: Duplexer<CrcData> = {
	read(stream: Readable) {
		return {
			crc: UInt32.read(stream),
			tickOfCrc: UInt32.read(stream),
		};
	},
	write(stream: Writable, data: CrcData) {
		UInt32.write(stream, data.crc);
		UInt32.write(stream, data.tickOfCrc);
	},
};

export enum ShootingStateState {
	NotShooting,
	ShootingEnemies,
	ShootingSelected,
}
export type ShootingState = { state: ShootingStateState, target: MapPosition };
export const ShootingState: Duplexer<ShootingState> = {
	read(stream: Readable) {
		return {
			state: UInt8.read(stream),
			target: MapPosition.read(stream),
		};
	},
	write(stream: Writable, state: ShootingState) {
		UInt8.write(stream, state.state);
		MapPosition.write(stream, state.target);
	},
};

export type PlayerJoinGameData = {
	peerID: number,
	playerIndex: number,
	forceID: number,
	username: string,
	asEditor: boolean,
	admin: boolean,
}
export const PlayerJoinGameData: Duplexer<PlayerJoinGameData> = {
	read(stream: Readable) {
		return {
			peerID: SpaceOptimizedUInt16.read(stream),
			playerIndex: UInt16.read(stream),
			forceID: UInt8.read(stream),
			username: Utf8String.read(stream),
			asEditor: Bool.read(stream),
			admin: Bool.read(stream),
		};
	},
	write(stream: Writable, data: PlayerJoinGameData) {
		SpaceOptimizedUInt16.write(stream, data.peerID);
		UInt16.write(stream, data.playerIndex);
		UInt8.write(stream, data.forceID);
		Utf8String.write(stream, data.username);
		Bool.write(stream, data.asEditor);
		Bool.write(stream, data.admin);
	},
};

export type ServerCommandData = {
	command: Buffer,
	id: number,
	connectionID: Buffer,
}
export const ServerCommandData: Duplexer<ServerCommandData> = {
	read(stream: Readable) {
		return {
			command: StringT.read(stream),
			id: UInt32.read(stream),
			connectionID: BufferT.read(stream, 8),
		};
	},
	write(stream: Writable, data: ServerCommandData) {
		StringT.write(stream, data.command);
		UInt32.write(stream, data.id);
		BufferT.write(stream, data.connectionID);
	},
};


export enum InputActionType {
	Nothing,
	StopWalking,
	BeginMining,
	StopMining,
	ToggleDriving,
	OpenGui,
	CloseGui,
	OpenCharacterGui,
	OpenCurrentVehicleGui,
	ConnectRollingStock,
	DisconnectRollingStock,
	SelectedEntityCleared,
	ClearCursor,
	ResetAssemblingMachine,
	OpenTechnologyGui,
	LaunchRocket,
	OpenProductionGui,
	StopRepair,
	CancelNewBlueprint,
	CloseBlueprintRecord,
	CopyEntitySettings,
	PasteEntitySettings,
	DestroyOpenedItem,
	CopyOpenedItem,
	ToggleShowEntityInfo,
	SingleplayerInit,
	MultiplayerInit,
	DisconnectAllPlayers,
	SwitchToRenameStopGui,
	OpenBonusGui,
	OpenTrainsGui,
	OpenAchievementsGui,
	CycleBlueprintBookForwards,
	CycleBlueprintBookBackwards,
	CycleClipboardForwards,
	CycleClipboardBackwards,
	StopMovementInTheNextTick,
	ToggleEnableVehicleLogisticsWhileMoving,
	ToggleDeconstructionItemEntityFilterMode,
	ToggleDeconstructionItemTileFilterMode,
	OpenLogisticGui,
	SelectNextValidGun,
	ToggleMapEditor,
	DeleteBlueprintLibrary,
	GameCreatedFromScenario,
	ActivateCopy,
	ActivateCut,
	ActivatePaste,
	Undo,
	TogglePersonalRoboport,
	ToggleEquipmentMovementBonus,
	TogglePersonalLogisticRequests,
	ToggleEntityLogisticRequests,
	StopBuildingByMoving,
	FlushOpenedEntityFluid,
	ForceFullCRC,

	OpenTipsAndTricksGui,
	OpenBlueprintLibraryGui,
	ChangeBlueprintLibraryTab,
	DropItem,
	Build,
	StartWalking,
	BeginMiningTerrain,
	ChangeRidingState,
	OpenItem,
	OpenParentOfOpenedItem,
	ResetItem,
	DestroyItem,
	OpenModItem,
	OpenEquipment,
	CursorTransfer,
	CursorSplit,
	StackTransfer,
	InventoryTransfer,
	CheckCRCHeuristic,
	Craft,
	WireDragging,
	ChangeShootingState,
	SetupAssemblingMachine,
	SelectedEntityChanged,
	SmartPipette,
	StackSplit,
	InventorySplit,
	CancelCraft,
	SetFilter,
	CheckCRC,
	SetCircuitCondition,
	SetSignal,
	StartResearch,
	SetLogisticFilterItem,
	SetLogisticFilterSignal,
	SetCircuitModeOfOperation,
	GuiClick,
	GuiConfirmed,
	WriteToConsole,
	MarketOffer,
	AddTrainStation,
	ChangeTrainStopStation,
	ChangeActiveItemGroupForCrafting,
	ChangeActiveItemGroupForFilters,
	ChangeActiveCharacterTab,
	GuiTextChanged,
	GuiCheckedStateChanged,
	GuiSelectionStateChanged,
	GuiSelectedTabChanged,
	GuiValueChanged,
	GuiSwitchStateChanged,
	GuiLocationChanged,
	PlaceEquipment,
	TakeEquipment,
	UseItem,
	SendSpidertron,
	UseArtilleryRemote,
	SetInventoryBar,
	MoveOnZoom,
	StartRepair,
	Deconstruct,
	Upgrade,
	Copy,
	AlternativeCopy,
	SelectBlueprintEntities,
	AltSelectBlueprintEntities,
	SetupBlueprint,
	SetupSingleBlueprintRecord,
	CopyOpenedBlueprint,
	ReassignBlueprint,
	OpenBlueprintRecord,
	GrabBlueprintRecord,
	DropBlueprintRecord,
	DeleteBlueprintRecord,
	UpgradeOpenedBlueprintByRecord,
	UpgradeOpenedBlueprintByItem,
	SpawnItem,
	SpawnItemStackTransfer,
	UpdateBlueprintShelf,
	TransferBlueprint,
	TransferBlueprintImmediately,
	EditBlueprintToolPreview,
	RemoveCables,
	ExportBlueprint,
	ImportBlueprint,
	ImportBlueprintsFiltered,
	PlayerJoinGame,
	PlayerAdminChange,
	CancelDeconstruct,
	CancelUpgrade,
	ChangeArithmeticCombinatorParameters,
	ChangeDeciderCombinatorParameters,
	ChangeProgrammableSpeakerParameters,
	ChangeProgrammableSpeakerAlertParameters,
	ChangeProgrammableSpeakerCircuitParameters,
	SetVehicleAutomaticTargetingParameters,
	BuildTerrain,
	ChangeTrainWaitCondition,
	ChangeTrainWaitConditionData,
	CustomInput,
	ChangeItemLabel,
	ChangeItemDescription,
	ChangeEntityLabel,
	BuildRail,
	CancelResearch,
	SelectArea,
	AltSelectArea,
	ReverseSelectArea,
	ServerCommand,
	SetControllerLogisticTrashFilterItem,
	SetEntityLogisticTrashFilterItem,
	SetInfinityContainerFilterItem,
	SetInfinityPipeFilter,
	ModSettingsChanged,
	SetEntityEnergyProperty,
	EditCustomTag,
	EditPermissionGroup,
	ImportBlueprintString,
	ImportPermissionsString,
	ReloadScript,
	ReloadScriptDataTooLarge,
	GuiElemChanged,
	BlueprintTransferQueueUpdate,
	DragTrainSchedule,
	DragTrainWaitCondition,
	SelectItem,
	SelectEntitySlot,
	SelectTileSlot,
	SelectMapperSlot,
	DisplayResolutionChanged,
	QuickBarSetSlot,
	QuickBarPickSlot,
	QuickBarSetSelectedPage,
	PlayerLeaveGame,
	MapEditorAction,
	PutSpecialItemInMap,
	PutSpecialRecordInMap,
	ChangeMultiplayerConfig,
	AdminAction,
	LuaShortcut,
	TranslateString,
	FlushOpenedEntitySpecificFluid,
	ChangePickingState,
	SelectedEntityChangedVeryClose,
	SelectedEntityChangedVeryClosePrecise,
	SelectedEntityChangedRelative,
	SelectedEntityChangedBasedOnUnitNumber,
	SetAutosortInventory,
	SetFlatControllerGui,
	SetRecipeNotifications,
	SetAutoLaunchRocket,
	SwitchConstantCombinatorState,
	SwitchPowerSwitchState,
	SwitchInserterFilterModeState,
	SwitchConnectToLogisticNetwork,
	SetBehaviorMode,
	FastEntityTransfer,
	RotateEntity,
	FastEntitySplit,
	SetTrainStopped,
	ChangeControllerSpeed,
	SetAllowCommands,
	SetResearchFinishedStopsGame,
	SetInserterMaxStackSize,
	OpenTrainGui,
	SetEntityColor,
	SetDeconstructionItemTreesAndRocksOnly,
	SetDeconstructionItemTileSelectionMode,
	DeleteCustomTag,
	DeletePermissionGroup,
	AddPermissionGroup,
	SetInfinityContainerRemoveUnfilteredItems,
	SetCarWeaponsControl,
	SetRequestFromBuffers,
	ChangeActiveQuickBar,
	OpenPermissionsGui,
	DisplayScaleChanged,
	SetSplitterPriority,
	GrabInternalBlueprintFromText,
	SetHeatInterfaceTemperature,
	SetHeatInterfaceMode,
	OpenTrainStationGui,
	RemoveTrainStation,
	GoToTrainStation,
	RenderModeChanged,
	SetPlayerColor,
	PlayerClickedGpsTag,
	SetTrainsLimit,
	ClearRecipeNotification,
	SetLinkedContainerLinkID,
}

export type InputActionValueType = {
	[InputActionType.Nothing]: undefined,
	[InputActionType.StopWalking]: undefined,
	[InputActionType.BeginMining]: undefined,
	[InputActionType.StopMining]: undefined,
	[InputActionType.ToggleDriving]: undefined,
	[InputActionType.OpenGui]: undefined,
	[InputActionType.CloseGui]: undefined,
	[InputActionType.OpenCharacterGui]: undefined,
	[InputActionType.OpenCurrentVehicleGui]: undefined,
	[InputActionType.ConnectRollingStock]: undefined,
	[InputActionType.DisconnectRollingStock]: undefined,
	[InputActionType.SelectedEntityCleared]: undefined,
	[InputActionType.ClearCursor]: undefined,
	[InputActionType.ResetAssemblingMachine]: undefined,
	[InputActionType.OpenTechnologyGui]: undefined,
	[InputActionType.LaunchRocket]: undefined,
	[InputActionType.OpenProductionGui]: undefined,
	[InputActionType.StopRepair]: undefined,
	[InputActionType.CancelNewBlueprint]: undefined,
	[InputActionType.CloseBlueprintRecord]: undefined,
	[InputActionType.CopyEntitySettings]: undefined,
	[InputActionType.PasteEntitySettings]: undefined,
	[InputActionType.DestroyOpenedItem]: undefined,
	[InputActionType.CopyOpenedItem]: undefined,
	[InputActionType.ToggleShowEntityInfo]: undefined,
	[InputActionType.SingleplayerInit]: undefined,
	[InputActionType.MultiplayerInit]: undefined,
	[InputActionType.DisconnectAllPlayers]: undefined,
	[InputActionType.SwitchToRenameStopGui]: undefined,
	[InputActionType.OpenBonusGui]: undefined,
	[InputActionType.OpenTrainsGui]: undefined,
	[InputActionType.OpenAchievementsGui]: undefined,
	[InputActionType.CycleBlueprintBookForwards]: undefined,
	[InputActionType.CycleBlueprintBookBackwards]: undefined,
	[InputActionType.CycleClipboardForwards]: undefined,
	[InputActionType.CycleClipboardBackwards]: undefined,
	[InputActionType.StopMovementInTheNextTick]: undefined,
	[InputActionType.ToggleEnableVehicleLogisticsWhileMoving]: undefined,
	[InputActionType.ToggleDeconstructionItemEntityFilterMode]: undefined,
	[InputActionType.ToggleDeconstructionItemTileFilterMode]: undefined,
	[InputActionType.OpenLogisticGui]: undefined,
	[InputActionType.SelectNextValidGun]: undefined,
	[InputActionType.ToggleMapEditor]: undefined,
	[InputActionType.DeleteBlueprintLibrary]: undefined,
	[InputActionType.GameCreatedFromScenario]: undefined,
	[InputActionType.ActivateCopy]: undefined,
	[InputActionType.ActivateCut]: undefined,
	[InputActionType.ActivatePaste]: undefined,
	[InputActionType.Undo]: undefined,
	[InputActionType.TogglePersonalRoboport]: undefined,
	[InputActionType.ToggleEquipmentMovementBonus]: undefined,
	[InputActionType.TogglePersonalLogisticRequests]: undefined,
	[InputActionType.ToggleEntityLogisticRequests]: undefined,
	[InputActionType.StopBuildingByMoving]: undefined,
	[InputActionType.FlushOpenedEntityFluid]: undefined,
	[InputActionType.ForceFullCRC]: undefined,

	[InputActionType.OpenTipsAndTricksGui]: never,
	[InputActionType.OpenBlueprintLibraryGui]: never,
	[InputActionType.ChangeBlueprintLibraryTab]: never,
	[InputActionType.DropItem]: never,
	[InputActionType.Build]: never,
	[InputActionType.StartWalking]: Direction,
	[InputActionType.BeginMiningTerrain]: never,
	[InputActionType.ChangeRidingState]: never,
	[InputActionType.OpenItem]: never,
	[InputActionType.OpenParentOfOpenedItem]: never,
	[InputActionType.ResetItem]: never,
	[InputActionType.DestroyItem]: never,
	[InputActionType.OpenModItem]: never,
	[InputActionType.OpenEquipment]: never,
	[InputActionType.CursorTransfer]: never,
	[InputActionType.CursorSplit]: never,
	[InputActionType.StackTransfer]: never,
	[InputActionType.InventoryTransfer]: never,
	[InputActionType.CheckCRCHeuristic]: CrcData,
	[InputActionType.Craft]: never,
	[InputActionType.WireDragging]: never,
	[InputActionType.ChangeShootingState]: ShootingState,
	[InputActionType.SetupAssemblingMachine]: never,
	[InputActionType.SelectedEntityChanged]: never,
	[InputActionType.SmartPipette]: never,
	[InputActionType.StackSplit]: never,
	[InputActionType.InventorySplit]: never,
	[InputActionType.CancelCraft]: never,
	[InputActionType.SetFilter]: never,
	[InputActionType.CheckCRC]: CrcData,
	[InputActionType.SetCircuitCondition]: never,
	[InputActionType.SetSignal]: never,
	[InputActionType.StartResearch]: never,
	[InputActionType.SetLogisticFilterItem]: never,
	[InputActionType.SetLogisticFilterSignal]: never,
	[InputActionType.SetCircuitModeOfOperation]: never,
	[InputActionType.GuiClick]: never,
	[InputActionType.GuiConfirmed]: never,
	[InputActionType.WriteToConsole]: never,
	[InputActionType.MarketOffer]: never,
	[InputActionType.AddTrainStation]: never,
	[InputActionType.ChangeTrainStopStation]: never,
	[InputActionType.ChangeActiveItemGroupForCrafting]: never,
	[InputActionType.ChangeActiveItemGroupForFilters]: never,
	[InputActionType.ChangeActiveCharacterTab]: never,
	[InputActionType.GuiTextChanged]: never,
	[InputActionType.GuiCheckedStateChanged]: never,
	[InputActionType.GuiSelectionStateChanged]: never,
	[InputActionType.GuiSelectedTabChanged]: never,
	[InputActionType.GuiValueChanged]: never,
	[InputActionType.GuiSwitchStateChanged]: never,
	[InputActionType.GuiLocationChanged]: never,
	[InputActionType.PlaceEquipment]: never,
	[InputActionType.TakeEquipment]: never,
	[InputActionType.UseItem]: never,
	[InputActionType.SendSpidertron]: never,
	[InputActionType.UseArtilleryRemote]: never,
	[InputActionType.SetInventoryBar]: never,
	[InputActionType.MoveOnZoom]: never,
	[InputActionType.StartRepair]: never,
	[InputActionType.Deconstruct]: never,
	[InputActionType.Upgrade]: never,
	[InputActionType.Copy]: never,
	[InputActionType.AlternativeCopy]: never,
	[InputActionType.SelectBlueprintEntities]: never,
	[InputActionType.AltSelectBlueprintEntities]: never,
	[InputActionType.SetupBlueprint]: never,
	[InputActionType.SetupSingleBlueprintRecord]: never,
	[InputActionType.CopyOpenedBlueprint]: never,
	[InputActionType.ReassignBlueprint]: never,
	[InputActionType.OpenBlueprintRecord]: never,
	[InputActionType.GrabBlueprintRecord]: never,
	[InputActionType.DropBlueprintRecord]: never,
	[InputActionType.DeleteBlueprintRecord]: never,
	[InputActionType.UpgradeOpenedBlueprintByRecord]: never,
	[InputActionType.UpgradeOpenedBlueprintByItem]: never,
	[InputActionType.SpawnItem]: never,
	[InputActionType.SpawnItemStackTransfer]: never,
	[InputActionType.UpdateBlueprintShelf]: never,
	[InputActionType.TransferBlueprint]: never,
	[InputActionType.TransferBlueprintImmediately]: never,
	[InputActionType.EditBlueprintToolPreview]: never,
	[InputActionType.RemoveCables]: never,
	[InputActionType.ExportBlueprint]: never,
	[InputActionType.ImportBlueprint]: never,
	[InputActionType.ImportBlueprintsFiltered]: never,
	[InputActionType.PlayerJoinGame]: PlayerJoinGameData,
	[InputActionType.PlayerAdminChange]: never,
	[InputActionType.CancelDeconstruct]: never,
	[InputActionType.CancelUpgrade]: never,
	[InputActionType.ChangeArithmeticCombinatorParameters]: never,
	[InputActionType.ChangeDeciderCombinatorParameters]: never,
	[InputActionType.ChangeProgrammableSpeakerParameters]: never,
	[InputActionType.ChangeProgrammableSpeakerAlertParameters]: never,
	[InputActionType.ChangeProgrammableSpeakerCircuitParameters]: never,
	[InputActionType.SetVehicleAutomaticTargetingParameters]: never,
	[InputActionType.BuildTerrain]: never,
	[InputActionType.ChangeTrainWaitCondition]: never,
	[InputActionType.ChangeTrainWaitConditionData]: never,
	[InputActionType.CustomInput]: never,
	[InputActionType.ChangeItemLabel]: never,
	[InputActionType.ChangeItemDescription]: never,
	[InputActionType.ChangeEntityLabel]: never,
	[InputActionType.BuildRail]: never,
	[InputActionType.CancelResearch]: never,
	[InputActionType.SelectArea]: never,
	[InputActionType.AltSelectArea]: never,
	[InputActionType.ReverseSelectArea]: never,
	[InputActionType.ServerCommand]: ServerCommandData,
	[InputActionType.SetControllerLogisticTrashFilterItem]: never,
	[InputActionType.SetEntityLogisticTrashFilterItem]: never,
	[InputActionType.SetInfinityContainerFilterItem]: never,
	[InputActionType.SetInfinityPipeFilter]: never,
	[InputActionType.ModSettingsChanged]: never,
	[InputActionType.SetEntityEnergyProperty]: never,
	[InputActionType.EditCustomTag]: never,
	[InputActionType.EditPermissionGroup]: never,
	[InputActionType.ImportBlueprintString]: never,
	[InputActionType.ImportPermissionsString]: never,
	[InputActionType.ReloadScript]: never,
	[InputActionType.ReloadScriptDataTooLarge]: never,
	[InputActionType.GuiElemChanged]: never,
	[InputActionType.BlueprintTransferQueueUpdate]: never,
	[InputActionType.DragTrainSchedule]: never,
	[InputActionType.DragTrainWaitCondition]: never,
	[InputActionType.SelectItem]: never,
	[InputActionType.SelectEntitySlot]: never,
	[InputActionType.SelectTileSlot]: never,
	[InputActionType.SelectMapperSlot]: never,
	[InputActionType.DisplayResolutionChanged]: never,
	[InputActionType.QuickBarSetSlot]: never,
	[InputActionType.QuickBarPickSlot]: never,
	[InputActionType.QuickBarSetSelectedPage]: never,
	[InputActionType.PlayerLeaveGame]: DisconnectReason,
	[InputActionType.MapEditorAction]: never,
	[InputActionType.PutSpecialItemInMap]: never,
	[InputActionType.PutSpecialRecordInMap]: never,
	[InputActionType.ChangeMultiplayerConfig]: never,
	[InputActionType.AdminAction]: never,
	[InputActionType.LuaShortcut]: never,
	[InputActionType.TranslateString]: never,
	[InputActionType.FlushOpenedEntitySpecificFluid]: never,
	[InputActionType.ChangePickingState]: never,
	[InputActionType.SelectedEntityChangedVeryClose]: number,
	[InputActionType.SelectedEntityChangedVeryClosePrecise]: number,
	[InputActionType.SelectedEntityChangedRelative]: number,
	[InputActionType.SelectedEntityChangedBasedOnUnitNumber]: number,
	[InputActionType.SetAutosortInventory]: never,
	[InputActionType.SetFlatControllerGui]: never,
	[InputActionType.SetRecipeNotifications]: never,
	[InputActionType.SetAutoLaunchRocket]: never,
	[InputActionType.SwitchConstantCombinatorState]: never,
	[InputActionType.SwitchPowerSwitchState]: never,
	[InputActionType.SwitchInserterFilterModeState]: never,
	[InputActionType.SwitchConnectToLogisticNetwork]: never,
	[InputActionType.SetBehaviorMode]: never,
	[InputActionType.FastEntityTransfer]: never,
	[InputActionType.RotateEntity]: never,
	[InputActionType.FastEntitySplit]: never,
	[InputActionType.SetTrainStopped]: never,
	[InputActionType.ChangeControllerSpeed]: never,
	[InputActionType.SetAllowCommands]: never,
	[InputActionType.SetResearchFinishedStopsGame]: never,
	[InputActionType.SetInserterMaxStackSize]: never,
	[InputActionType.OpenTrainGui]: never,
	[InputActionType.SetEntityColor]: never,
	[InputActionType.SetDeconstructionItemTreesAndRocksOnly]: never,
	[InputActionType.SetDeconstructionItemTileSelectionMode]: never,
	[InputActionType.DeleteCustomTag]: never,
	[InputActionType.DeletePermissionGroup]: never,
	[InputActionType.AddPermissionGroup]: never,
	[InputActionType.SetInfinityContainerRemoveUnfilteredItems]: never,
	[InputActionType.SetCarWeaponsControl]: never,
	[InputActionType.SetRequestFromBuffers]: never,
	[InputActionType.ChangeActiveQuickBar]: never,
	[InputActionType.OpenPermissionsGui]: never,
	[InputActionType.DisplayScaleChanged]: never,
	[InputActionType.SetSplitterPriority]: never,
	[InputActionType.GrabInternalBlueprintFromText]: never,
	[InputActionType.SetHeatInterfaceTemperature]: never,
	[InputActionType.SetHeatInterfaceMode]: never,
	[InputActionType.OpenTrainStationGui]: never,
	[InputActionType.RemoveTrainStation]: never,
	[InputActionType.GoToTrainStation]: never,
	[InputActionType.RenderModeChanged]: never,
	[InputActionType.SetPlayerColor]: never,
	[InputActionType.PlayerClickedGpsTag]: never,
	[InputActionType.SetTrainsLimit]: never,
	[InputActionType.ClearRecipeNotification]: never,
	[InputActionType.SetLinkedContainerLinkID]: never,
};

const emptyDuplex = { read: () => undefined, write: () => {} };
const notImplementedDuplex = {
	read: () => { throw new Error("Not implemented"); },
	write: () => { throw new Error("Not implemented"); },
};

const inputActionDuplex: DuplexerLookupTable<InputActionType, InputActionValueType> = {
	[InputActionType.Nothing]: emptyDuplex,
	[InputActionType.StopWalking]: emptyDuplex,
	[InputActionType.BeginMining]: emptyDuplex,
	[InputActionType.StopMining]: emptyDuplex,
	[InputActionType.ToggleDriving]: emptyDuplex,
	[InputActionType.OpenGui]: emptyDuplex,
	[InputActionType.CloseGui]: emptyDuplex,
	[InputActionType.OpenCharacterGui]: emptyDuplex,
	[InputActionType.OpenCurrentVehicleGui]: emptyDuplex,
	[InputActionType.ConnectRollingStock]: emptyDuplex,
	[InputActionType.DisconnectRollingStock]: emptyDuplex,
	[InputActionType.SelectedEntityCleared]: emptyDuplex,
	[InputActionType.ClearCursor]: emptyDuplex,
	[InputActionType.ResetAssemblingMachine]: emptyDuplex,
	[InputActionType.OpenTechnologyGui]: emptyDuplex,
	[InputActionType.LaunchRocket]: emptyDuplex,
	[InputActionType.OpenProductionGui]: emptyDuplex,
	[InputActionType.StopRepair]: emptyDuplex,
	[InputActionType.CancelNewBlueprint]: emptyDuplex,
	[InputActionType.CloseBlueprintRecord]: emptyDuplex,
	[InputActionType.CopyEntitySettings]: emptyDuplex,
	[InputActionType.PasteEntitySettings]: emptyDuplex,
	[InputActionType.DestroyOpenedItem]: emptyDuplex,
	[InputActionType.CopyOpenedItem]: emptyDuplex,
	[InputActionType.ToggleShowEntityInfo]: emptyDuplex,
	[InputActionType.SingleplayerInit]: emptyDuplex,
	[InputActionType.MultiplayerInit]: emptyDuplex,
	[InputActionType.DisconnectAllPlayers]: emptyDuplex,
	[InputActionType.SwitchToRenameStopGui]: emptyDuplex,
	[InputActionType.OpenBonusGui]: emptyDuplex,
	[InputActionType.OpenTrainsGui]: emptyDuplex,
	[InputActionType.OpenAchievementsGui]: emptyDuplex,
	[InputActionType.CycleBlueprintBookForwards]: emptyDuplex,
	[InputActionType.CycleBlueprintBookBackwards]: emptyDuplex,
	[InputActionType.CycleClipboardForwards]: emptyDuplex,
	[InputActionType.CycleClipboardBackwards]: emptyDuplex,
	[InputActionType.StopMovementInTheNextTick]: emptyDuplex,
	[InputActionType.ToggleEnableVehicleLogisticsWhileMoving]: emptyDuplex,
	[InputActionType.ToggleDeconstructionItemEntityFilterMode]: emptyDuplex,
	[InputActionType.ToggleDeconstructionItemTileFilterMode]: emptyDuplex,
	[InputActionType.OpenLogisticGui]: emptyDuplex,
	[InputActionType.SelectNextValidGun]: emptyDuplex,
	[InputActionType.ToggleMapEditor]: emptyDuplex,
	[InputActionType.DeleteBlueprintLibrary]: emptyDuplex,
	[InputActionType.GameCreatedFromScenario]: emptyDuplex,
	[InputActionType.ActivateCopy]: emptyDuplex,
	[InputActionType.ActivateCut]: emptyDuplex,
	[InputActionType.ActivatePaste]: emptyDuplex,
	[InputActionType.Undo]: emptyDuplex,
	[InputActionType.TogglePersonalRoboport]: emptyDuplex,
	[InputActionType.ToggleEquipmentMovementBonus]: emptyDuplex,
	[InputActionType.TogglePersonalLogisticRequests]: emptyDuplex,
	[InputActionType.ToggleEntityLogisticRequests]: emptyDuplex,
	[InputActionType.StopBuildingByMoving]: emptyDuplex,
	[InputActionType.FlushOpenedEntityFluid]: emptyDuplex,
	[InputActionType.ForceFullCRC]: emptyDuplex,

	[InputActionType.OpenTipsAndTricksGui]: notImplementedDuplex,
	[InputActionType.OpenBlueprintLibraryGui]: notImplementedDuplex,
	[InputActionType.ChangeBlueprintLibraryTab]: notImplementedDuplex,
	[InputActionType.DropItem]: notImplementedDuplex,
	[InputActionType.Build]: notImplementedDuplex,
	[InputActionType.StartWalking]: Direction,
	[InputActionType.BeginMiningTerrain]: notImplementedDuplex,
	[InputActionType.ChangeRidingState]: notImplementedDuplex,
	[InputActionType.OpenItem]: notImplementedDuplex,
	[InputActionType.OpenParentOfOpenedItem]: notImplementedDuplex,
	[InputActionType.ResetItem]: notImplementedDuplex,
	[InputActionType.DestroyItem]: notImplementedDuplex,
	[InputActionType.OpenModItem]: notImplementedDuplex,
	[InputActionType.OpenEquipment]: notImplementedDuplex,
	[InputActionType.CursorTransfer]: notImplementedDuplex,
	[InputActionType.CursorSplit]: notImplementedDuplex,
	[InputActionType.StackTransfer]: notImplementedDuplex,
	[InputActionType.InventoryTransfer]: notImplementedDuplex,
	[InputActionType.CheckCRCHeuristic]: CrcData,
	[InputActionType.Craft]: notImplementedDuplex,
	[InputActionType.WireDragging]: notImplementedDuplex,
	[InputActionType.ChangeShootingState]: ShootingState,
	[InputActionType.SetupAssemblingMachine]: notImplementedDuplex,
	[InputActionType.SelectedEntityChanged]: notImplementedDuplex,
	[InputActionType.SmartPipette]: notImplementedDuplex,
	[InputActionType.StackSplit]: notImplementedDuplex,
	[InputActionType.InventorySplit]: notImplementedDuplex,
	[InputActionType.CancelCraft]: notImplementedDuplex,
	[InputActionType.SetFilter]: notImplementedDuplex,
	[InputActionType.CheckCRC]: CrcData,
	[InputActionType.SetCircuitCondition]: notImplementedDuplex,
	[InputActionType.SetSignal]: notImplementedDuplex,
	[InputActionType.StartResearch]: notImplementedDuplex,
	[InputActionType.SetLogisticFilterItem]: notImplementedDuplex,
	[InputActionType.SetLogisticFilterSignal]: notImplementedDuplex,
	[InputActionType.SetCircuitModeOfOperation]: notImplementedDuplex,
	[InputActionType.GuiClick]: notImplementedDuplex,
	[InputActionType.GuiConfirmed]: notImplementedDuplex,
	[InputActionType.WriteToConsole]: notImplementedDuplex,
	[InputActionType.MarketOffer]: notImplementedDuplex,
	[InputActionType.AddTrainStation]: notImplementedDuplex,
	[InputActionType.ChangeTrainStopStation]: notImplementedDuplex,
	[InputActionType.ChangeActiveItemGroupForCrafting]: notImplementedDuplex,
	[InputActionType.ChangeActiveItemGroupForFilters]: notImplementedDuplex,
	[InputActionType.ChangeActiveCharacterTab]: notImplementedDuplex,
	[InputActionType.GuiTextChanged]: notImplementedDuplex,
	[InputActionType.GuiCheckedStateChanged]: notImplementedDuplex,
	[InputActionType.GuiSelectionStateChanged]: notImplementedDuplex,
	[InputActionType.GuiSelectedTabChanged]: notImplementedDuplex,
	[InputActionType.GuiValueChanged]: notImplementedDuplex,
	[InputActionType.GuiSwitchStateChanged]: notImplementedDuplex,
	[InputActionType.GuiLocationChanged]: notImplementedDuplex,
	[InputActionType.PlaceEquipment]: notImplementedDuplex,
	[InputActionType.TakeEquipment]: notImplementedDuplex,
	[InputActionType.UseItem]: notImplementedDuplex,
	[InputActionType.SendSpidertron]: notImplementedDuplex,
	[InputActionType.UseArtilleryRemote]: notImplementedDuplex,
	[InputActionType.SetInventoryBar]: notImplementedDuplex,
	[InputActionType.MoveOnZoom]: notImplementedDuplex,
	[InputActionType.StartRepair]: notImplementedDuplex,
	[InputActionType.Deconstruct]: notImplementedDuplex,
	[InputActionType.Upgrade]: notImplementedDuplex,
	[InputActionType.Copy]: notImplementedDuplex,
	[InputActionType.AlternativeCopy]: notImplementedDuplex,
	[InputActionType.SelectBlueprintEntities]: notImplementedDuplex,
	[InputActionType.AltSelectBlueprintEntities]: notImplementedDuplex,
	[InputActionType.SetupBlueprint]: notImplementedDuplex,
	[InputActionType.SetupSingleBlueprintRecord]: notImplementedDuplex,
	[InputActionType.CopyOpenedBlueprint]: notImplementedDuplex,
	[InputActionType.ReassignBlueprint]: notImplementedDuplex,
	[InputActionType.OpenBlueprintRecord]: notImplementedDuplex,
	[InputActionType.GrabBlueprintRecord]: notImplementedDuplex,
	[InputActionType.DropBlueprintRecord]: notImplementedDuplex,
	[InputActionType.DeleteBlueprintRecord]: notImplementedDuplex,
	[InputActionType.UpgradeOpenedBlueprintByRecord]: notImplementedDuplex,
	[InputActionType.UpgradeOpenedBlueprintByItem]: notImplementedDuplex,
	[InputActionType.SpawnItem]: notImplementedDuplex,
	[InputActionType.SpawnItemStackTransfer]: notImplementedDuplex,
	[InputActionType.UpdateBlueprintShelf]: notImplementedDuplex,
	[InputActionType.TransferBlueprint]: notImplementedDuplex,
	[InputActionType.TransferBlueprintImmediately]: notImplementedDuplex,
	[InputActionType.EditBlueprintToolPreview]: notImplementedDuplex,
	[InputActionType.RemoveCables]: notImplementedDuplex,
	[InputActionType.ExportBlueprint]: notImplementedDuplex,
	[InputActionType.ImportBlueprint]: notImplementedDuplex,
	[InputActionType.ImportBlueprintsFiltered]: notImplementedDuplex,
	[InputActionType.PlayerJoinGame]: PlayerJoinGameData,
	[InputActionType.PlayerAdminChange]: notImplementedDuplex,
	[InputActionType.CancelDeconstruct]: notImplementedDuplex,
	[InputActionType.CancelUpgrade]: notImplementedDuplex,
	[InputActionType.ChangeArithmeticCombinatorParameters]: notImplementedDuplex,
	[InputActionType.ChangeDeciderCombinatorParameters]: notImplementedDuplex,
	[InputActionType.ChangeProgrammableSpeakerParameters]: notImplementedDuplex,
	[InputActionType.ChangeProgrammableSpeakerAlertParameters]: notImplementedDuplex,
	[InputActionType.ChangeProgrammableSpeakerCircuitParameters]: notImplementedDuplex,
	[InputActionType.SetVehicleAutomaticTargetingParameters]: notImplementedDuplex,
	[InputActionType.BuildTerrain]: notImplementedDuplex,
	[InputActionType.ChangeTrainWaitCondition]: notImplementedDuplex,
	[InputActionType.ChangeTrainWaitConditionData]: notImplementedDuplex,
	[InputActionType.CustomInput]: notImplementedDuplex,
	[InputActionType.ChangeItemLabel]: notImplementedDuplex,
	[InputActionType.ChangeItemDescription]: notImplementedDuplex,
	[InputActionType.ChangeEntityLabel]: notImplementedDuplex,
	[InputActionType.BuildRail]: notImplementedDuplex,
	[InputActionType.CancelResearch]: notImplementedDuplex,
	[InputActionType.SelectArea]: notImplementedDuplex,
	[InputActionType.AltSelectArea]: notImplementedDuplex,
	[InputActionType.ReverseSelectArea]: notImplementedDuplex,
	[InputActionType.ServerCommand]: ServerCommandData,
	[InputActionType.SetControllerLogisticTrashFilterItem]: notImplementedDuplex,
	[InputActionType.SetEntityLogisticTrashFilterItem]: notImplementedDuplex,
	[InputActionType.SetInfinityContainerFilterItem]: notImplementedDuplex,
	[InputActionType.SetInfinityPipeFilter]: notImplementedDuplex,
	[InputActionType.ModSettingsChanged]: notImplementedDuplex,
	[InputActionType.SetEntityEnergyProperty]: notImplementedDuplex,
	[InputActionType.EditCustomTag]: notImplementedDuplex,
	[InputActionType.EditPermissionGroup]: notImplementedDuplex,
	[InputActionType.ImportBlueprintString]: notImplementedDuplex,
	[InputActionType.ImportPermissionsString]: notImplementedDuplex,
	[InputActionType.ReloadScript]: notImplementedDuplex,
	[InputActionType.ReloadScriptDataTooLarge]: notImplementedDuplex,
	[InputActionType.GuiElemChanged]: notImplementedDuplex,
	[InputActionType.BlueprintTransferQueueUpdate]: notImplementedDuplex,
	[InputActionType.DragTrainSchedule]: notImplementedDuplex,
	[InputActionType.DragTrainWaitCondition]: notImplementedDuplex,
	[InputActionType.SelectItem]: notImplementedDuplex,
	[InputActionType.SelectEntitySlot]: notImplementedDuplex,
	[InputActionType.SelectTileSlot]: notImplementedDuplex,
	[InputActionType.SelectMapperSlot]: notImplementedDuplex,
	[InputActionType.DisplayResolutionChanged]: notImplementedDuplex,
	[InputActionType.QuickBarSetSlot]: notImplementedDuplex,
	[InputActionType.QuickBarPickSlot]: notImplementedDuplex,
	[InputActionType.QuickBarSetSelectedPage]: notImplementedDuplex,
	[InputActionType.PlayerLeaveGame]: UInt8,
	[InputActionType.MapEditorAction]: notImplementedDuplex,
	[InputActionType.PutSpecialItemInMap]: notImplementedDuplex,
	[InputActionType.PutSpecialRecordInMap]: notImplementedDuplex,
	[InputActionType.ChangeMultiplayerConfig]: notImplementedDuplex,
	[InputActionType.AdminAction]: notImplementedDuplex,
	[InputActionType.LuaShortcut]: notImplementedDuplex,
	[InputActionType.TranslateString]: notImplementedDuplex,
	[InputActionType.FlushOpenedEntitySpecificFluid]: notImplementedDuplex,
	[InputActionType.ChangePickingState]: notImplementedDuplex,
	[InputActionType.SelectedEntityChangedVeryClose]: UInt8,
	[InputActionType.SelectedEntityChangedVeryClosePrecise]: UInt16,
	[InputActionType.SelectedEntityChangedRelative]: UInt32,
	[InputActionType.SelectedEntityChangedBasedOnUnitNumber]: UInt32,
	[InputActionType.SetAutosortInventory]: notImplementedDuplex,
	[InputActionType.SetFlatControllerGui]: notImplementedDuplex,
	[InputActionType.SetRecipeNotifications]: notImplementedDuplex,
	[InputActionType.SetAutoLaunchRocket]: notImplementedDuplex,
	[InputActionType.SwitchConstantCombinatorState]: notImplementedDuplex,
	[InputActionType.SwitchPowerSwitchState]: notImplementedDuplex,
	[InputActionType.SwitchInserterFilterModeState]: notImplementedDuplex,
	[InputActionType.SwitchConnectToLogisticNetwork]: notImplementedDuplex,
	[InputActionType.SetBehaviorMode]: notImplementedDuplex,
	[InputActionType.FastEntityTransfer]: notImplementedDuplex,
	[InputActionType.RotateEntity]: notImplementedDuplex,
	[InputActionType.FastEntitySplit]: notImplementedDuplex,
	[InputActionType.SetTrainStopped]: notImplementedDuplex,
	[InputActionType.ChangeControllerSpeed]: notImplementedDuplex,
	[InputActionType.SetAllowCommands]: notImplementedDuplex,
	[InputActionType.SetResearchFinishedStopsGame]: notImplementedDuplex,
	[InputActionType.SetInserterMaxStackSize]: notImplementedDuplex,
	[InputActionType.OpenTrainGui]: notImplementedDuplex,
	[InputActionType.SetEntityColor]: notImplementedDuplex,
	[InputActionType.SetDeconstructionItemTreesAndRocksOnly]: notImplementedDuplex,
	[InputActionType.SetDeconstructionItemTileSelectionMode]: notImplementedDuplex,
	[InputActionType.DeleteCustomTag]: notImplementedDuplex,
	[InputActionType.DeletePermissionGroup]: notImplementedDuplex,
	[InputActionType.AddPermissionGroup]: notImplementedDuplex,
	[InputActionType.SetInfinityContainerRemoveUnfilteredItems]: notImplementedDuplex,
	[InputActionType.SetCarWeaponsControl]: notImplementedDuplex,
	[InputActionType.SetRequestFromBuffers]: notImplementedDuplex,
	[InputActionType.ChangeActiveQuickBar]: notImplementedDuplex,
	[InputActionType.OpenPermissionsGui]: notImplementedDuplex,
	[InputActionType.DisplayScaleChanged]: notImplementedDuplex,
	[InputActionType.SetSplitterPriority]: notImplementedDuplex,
	[InputActionType.GrabInternalBlueprintFromText]: notImplementedDuplex,
	[InputActionType.SetHeatInterfaceTemperature]: notImplementedDuplex,
	[InputActionType.SetHeatInterfaceMode]: notImplementedDuplex,
	[InputActionType.OpenTrainStationGui]: notImplementedDuplex,
	[InputActionType.RemoveTrainStation]: notImplementedDuplex,
	[InputActionType.GoToTrainStation]: notImplementedDuplex,
	[InputActionType.RenderModeChanged]: notImplementedDuplex,
	[InputActionType.SetPlayerColor]: notImplementedDuplex,
	[InputActionType.PlayerClickedGpsTag]: notImplementedDuplex,
	[InputActionType.SetTrainsLimit]: notImplementedDuplex,
	[InputActionType.ClearRecipeNotification]: notImplementedDuplex,
	[InputActionType.SetLinkedContainerLinkID]: notImplementedDuplex,
};

export class InputAction<T extends InputActionType = InputActionType> {
	constructor(
		public type: T,
		public data: InputActionValueType[T],
		// For convenience when creating actions to send the playerIndex can
		// be left out which will cause FactorioClient.sendInTickClosure
		// to set it to the client's playerIndex
		public playerIndex?: number,
	) { }

	static read(stream: Readable, lastPlayerIndex: number = 0) {
		const type = UInt8.read(stream);
		return this.readPayload(stream, type, lastPlayerIndex);
	}

	static readPayload(stream: Readable, type: InputActionType, lastPlayerIndex: number = 0) {
		const playerIndex = (SpaceOptimizedUInt16.read(stream) + lastPlayerIndex) & 0xffff;

		const duplex = inputActionDuplex[type];
		if (duplex === notImplementedDuplex) {
			throw new DecodeError(
				`Unknown input action ${InputActionType[type]} (${type})`,
				{ stream, inputActionType: type },
			);
		}

		return new InputAction(
			type,
			duplex.read(stream),
			playerIndex,
		);
	}

	static write(stream: Writable, input: InputAction, lastPlayerIndex: number) {
		UInt8.write(stream, input.type);
		this.writePayload(stream, input, lastPlayerIndex);
	}

	static writePayload<T extends InputActionType>(
		stream: Writable, input: InputAction<T>, lastPlayerIndex: number
	) {
		SpaceOptimizedUInt16.write(stream, input.playerIndex! - lastPlayerIndex & 0xffff);
		const duplex = inputActionDuplex[input.type];
		if (duplex as unknown === notImplementedDuplex) {
			throw new EncodeError(
				`Unknown input action ${InputActionType[input.type]} (${input.type})`,
				{ stream, target: input },
			);
		}

		duplex.write(stream, input.data);
	}
}


export class InputActionSegment {
	constructor(
		public type: InputActionType,
		public id: number,
		public playerIndex: number,
		public totalSegments: number,
		public segmentNumber: number,
		public payload: Buffer,
	) { }

	static read(stream: Readable) {
		return new InputActionSegment(
			UInt8.read(stream),
			UInt32.read(stream),
			SpaceOptimizedUInt16.read(stream),
			SpaceOptimizedUInt32.read(stream),
			SpaceOptimizedUInt32.read(stream),
			StringT.read(stream),
		);
	}

	static write(stream: Writable, segment: InputActionSegment) {
		UInt8.write(stream, segment.type);
		UInt32.write(stream, segment.id);
		SpaceOptimizedUInt16.write(stream, segment.playerIndex);
		SpaceOptimizedUInt32.write(stream, segment.totalSegments);
		SpaceOptimizedUInt32.write(stream, segment.segmentNumber);
		StringT.write(stream, segment.payload);
	}
}
