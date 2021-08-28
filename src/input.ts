import { DecodeError, ReadableStream, EncodeError, WritableStream } from "./stream";
import { Direction, DisconnectReason } from "./data";

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

export type CrcData = { crc: number, tickOfCrc: number };
export type PlayerJoinGameData = {
	peerID: number,
	playerIndex: number,
	forceID: number,
	username: string,
	asEditor: boolean,
	admin: boolean,
}

export type InputData =
	Direction |
	CrcData |
	PlayerJoinGameData |
	DisconnectReason
;

export class InputAction {
	constructor(
		public type: InputActionType,
		public data?: InputData,
		// For convenience when creating actions to send the playerIndex can
		// be left out which will cause FactorioClient.sendInTickClosure
		// to set it to the client's playerIndex
		public playerIndex?: number,
	) { }

	static read(stream: ReadableStream, lastPlayerIndex: number) {
		const type = stream.readUInt8();
		const playerIndex = (stream.readSpaceOptimizedUInt16() + lastPlayerIndex) & 0xffff;

		let data;
		switch (type) {
			case InputActionType.Nothing:
			case InputActionType.StopWalking:
			case InputActionType.BeginMining:
			case InputActionType.StopMining:
			case InputActionType.ToggleDriving:
			case InputActionType.OpenGui:
			case InputActionType.CloseGui:
			case InputActionType.OpenCharacterGui:
			case InputActionType.OpenCurrentVehicleGui:
			case InputActionType.ConnectRollingStock:
			case InputActionType.DisconnectRollingStock:
			case InputActionType.SelectedEntityCleared:
			case InputActionType.ClearCursor:
			case InputActionType.ResetAssemblingMachine:
			case InputActionType.OpenTechnologyGui:
			case InputActionType.LaunchRocket:
			case InputActionType.OpenProductionGui:
			case InputActionType.StopRepair:
			case InputActionType.CancelNewBlueprint:
			case InputActionType.CloseBlueprintRecord:
			case InputActionType.CopyEntitySettings:
			case InputActionType.PasteEntitySettings:
			case InputActionType.DestroyOpenedItem:
			case InputActionType.CopyOpenedItem:
			case InputActionType.ToggleShowEntityInfo:
			case InputActionType.SingleplayerInit:
			case InputActionType.MultiplayerInit:
			case InputActionType.DisconnectAllPlayers:
			case InputActionType.SwitchToRenameStopGui:
			case InputActionType.OpenBonusGui:
			case InputActionType.OpenTrainsGui:
			case InputActionType.OpenAchievementsGui:
			case InputActionType.CycleBlueprintBookForwards:
			case InputActionType.CycleBlueprintBookBackwards:
			case InputActionType.CycleClipboardForwards:
			case InputActionType.CycleClipboardBackwards:
			case InputActionType.StopMovementInTheNextTick:
			case InputActionType.ToggleEnableVehicleLogisticsWhileMoving:
			case InputActionType.ToggleDeconstructionItemEntityFilterMode:
			case InputActionType.ToggleDeconstructionItemTileFilterMode:
			case InputActionType.OpenLogisticGui:
			case InputActionType.SelectNextValidGun:
			case InputActionType.ToggleMapEditor:
			case InputActionType.DeleteBlueprintLibrary:
			case InputActionType.GameCreatedFromScenario:
			case InputActionType.ActivateCopy:
			case InputActionType.ActivateCut:
			case InputActionType.ActivatePaste:
			case InputActionType.Undo:
			case InputActionType.TogglePersonalRoboport:
			case InputActionType.ToggleEquipmentMovementBonus:
			case InputActionType.TogglePersonalLogisticRequests:
			case InputActionType.ToggleEntityLogisticRequests:
			case InputActionType.StopBuildingByMoving:
			case InputActionType.FlushOpenedEntityFluid:
			case InputActionType.ForceFullCRC:
				break; // No data

			case InputActionType.StartWalking:
				data = Direction.read(stream);
				break;

			case InputActionType.CheckCRCHeuristic:
			case InputActionType.CheckCRC:
				data = {
					crc: stream.readUInt32(),
					tickOfCrc: stream.readUInt32(),
				};
				break;

			case InputActionType.PlayerJoinGame:
				data = {
					peerID: stream.readSpaceOptimizedUInt16(),
					playerIndex: stream.readUInt16(),
					forceID: stream.readUInt8(),
					username: stream.readUtf8String(),
					asEditor: stream.readBool(),
					admin: stream.readBool(),
				}
				break;

			case InputActionType.PlayerLeaveGame:
				data = stream.readUInt8();
				break;

			default:
				throw new DecodeError(
					`Unknown input action ${InputActionType[type]} (${type})`,
					{ stream, inputActionType: type },
				);
		}

		return new InputAction(
			type,
			data,
			playerIndex,
		);
	}

	write(stream: WritableStream, lastPlayerIndex: number) {
		stream.writeUInt8(this.type);
		stream.writeSpaceOptimizedUInt16(this.playerIndex! - lastPlayerIndex & 0xffff);

		switch (this.type) {
			case InputActionType.Nothing:
			case InputActionType.StopWalking:
			case InputActionType.BeginMining:
			case InputActionType.StopMining:
			case InputActionType.ToggleDriving:
			case InputActionType.OpenGui:
			case InputActionType.CloseGui:
			case InputActionType.OpenCharacterGui:
			case InputActionType.OpenCurrentVehicleGui:
			case InputActionType.ConnectRollingStock:
			case InputActionType.DisconnectRollingStock:
			case InputActionType.SelectedEntityCleared:
			case InputActionType.ClearCursor:
			case InputActionType.ResetAssemblingMachine:
			case InputActionType.OpenTechnologyGui:
			case InputActionType.LaunchRocket:
			case InputActionType.OpenProductionGui:
			case InputActionType.StopRepair:
			case InputActionType.CancelNewBlueprint:
			case InputActionType.CloseBlueprintRecord:
			case InputActionType.CopyEntitySettings:
			case InputActionType.PasteEntitySettings:
			case InputActionType.DestroyOpenedItem:
			case InputActionType.CopyOpenedItem:
			case InputActionType.ToggleShowEntityInfo:
			case InputActionType.SingleplayerInit:
			case InputActionType.MultiplayerInit:
			case InputActionType.DisconnectAllPlayers:
			case InputActionType.SwitchToRenameStopGui:
			case InputActionType.OpenBonusGui:
			case InputActionType.OpenTrainsGui:
			case InputActionType.OpenAchievementsGui:
			case InputActionType.CycleBlueprintBookForwards:
			case InputActionType.CycleBlueprintBookBackwards:
			case InputActionType.CycleClipboardForwards:
			case InputActionType.CycleClipboardBackwards:
			case InputActionType.StopMovementInTheNextTick:
			case InputActionType.ToggleEnableVehicleLogisticsWhileMoving:
			case InputActionType.ToggleDeconstructionItemEntityFilterMode:
			case InputActionType.ToggleDeconstructionItemTileFilterMode:
			case InputActionType.OpenLogisticGui:
			case InputActionType.SelectNextValidGun:
			case InputActionType.ToggleMapEditor:
			case InputActionType.DeleteBlueprintLibrary:
			case InputActionType.GameCreatedFromScenario:
			case InputActionType.ActivateCopy:
			case InputActionType.ActivateCut:
			case InputActionType.ActivatePaste:
			case InputActionType.Undo:
			case InputActionType.TogglePersonalRoboport:
			case InputActionType.ToggleEquipmentMovementBonus:
			case InputActionType.TogglePersonalLogisticRequests:
			case InputActionType.ToggleEntityLogisticRequests:
			case InputActionType.StopBuildingByMoving:
			case InputActionType.FlushOpenedEntityFluid:
			case InputActionType.ForceFullCRC:
				if (this.data !== undefined) {
					throw new Error(
						`Attempt to send data with empty input action ${InputActionType[this.type]}`
					);
				}
				break; // No data

			case InputActionType.StartWalking:
				(this.data! as Direction).write(stream);
				break;

			case InputActionType.CheckCRCHeuristic:
			case InputActionType.CheckCRC:
				const crcData = this.data! as CrcData;
				stream.writeUInt32(crcData.crc);
				stream.writeUInt32(crcData.tickOfCrc);
				break;

			case InputActionType.PlayerJoinGame:
				const playerJoinData = this.data! as PlayerJoinGameData;
				stream.writeSpaceOptimizedUInt16(playerJoinData.peerID);
				stream.writeUInt16(playerJoinData.playerIndex);
				stream.writeUInt8(playerJoinData.forceID);
				stream.writeUtf8String(playerJoinData.username);
				stream.writeBool(playerJoinData.asEditor);
				stream.writeBool(playerJoinData.admin);
				break;

			case InputActionType.PlayerLeaveGame:
				stream.writeUInt8(this.data! as DisconnectReason);
				break;

			default:
				throw new EncodeError(
					`Unknown input action ${InputActionType[this.type]} (${this.type})`,
					{ stream, target: this },
				);
		}
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

	static read(stream: ReadableStream) {
		return new InputActionSegment(
			stream.readUInt8(),
			stream.readUInt32(),
			stream.readSpaceOptimizedUInt16(),
			stream.readSpaceOptimizedUInt32(),
			stream.readSpaceOptimizedUInt32(),
			stream.readString(),
		);
	}

	write(stream: WritableStream) {
		stream.writeUInt8(this.type);
		stream.writeUInt32(this.id);
		stream.writeSpaceOptimizedUInt16(this.playerIndex);
		stream.writeSpaceOptimizedUInt32(this.totalSegments);
		stream.writeSpaceOptimizedUInt32(this.segmentNumber);
		stream.writeString(this.payload);
	}
}


