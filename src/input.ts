import {
	DecodeError, ReadableStream, EncodeError, WritableStream,
	readBool, readUInt8, readUInt16, readUInt32, readBuffer,
	readSpaceOptimizedUInt16, readSpaceOptimizedUInt32, readString, readUtf8String,
	writeBool, writeUInt8, writeUInt16, writeUInt32, writeBuffer,
	writeSpaceOptimizedUInt16, writeSpaceOptimizedUInt32, writeString, writeUtf8String,
} from "./stream";
import { Direction, MapPosition, DisconnectReason } from "./data";

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

export type CrcData = { crc: number, tickOfCrc: number };
export enum ShootingStateState {
	NotShooting,
	ShootingEnemies,
	ShootingSelected,
}
export type ShootingState = { state: ShootingStateState, target: MapPosition };
export type PlayerJoinGameData = {
	peerID: number,
	playerIndex: number,
	forceID: number,
	username: string,
	asEditor: boolean,
	admin: boolean,
}
export type ServerCommandData = {
	command: Buffer,
	id: number,
	connectionID: Buffer,
}

export type InputData =
	Direction |
	CrcData |
	ShootingState |
	PlayerJoinGameData |
	ServerCommandData |
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

	static read(stream: ReadableStream, lastPlayerIndex: number = 0) {
		const type = readUInt8(stream);
		return this.readPayload(stream, type, lastPlayerIndex);
	}

	static readPayload(stream: ReadableStream, type: InputActionType, lastPlayerIndex: number = 0) {
		const playerIndex = (readSpaceOptimizedUInt16(stream) + lastPlayerIndex) & 0xffff;

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
					crc: readUInt32(stream),
					tickOfCrc: readUInt32(stream),
				};
				break;

			case InputActionType.ChangeShootingState:
				data = {
					state: readUInt8(stream),
					target: MapPosition.read(stream),
				}
				break;

			case InputActionType.PlayerJoinGame:
				data = {
					peerID: readSpaceOptimizedUInt16(stream),
					playerIndex: readUInt16(stream),
					forceID: readUInt8(stream),
					username: readUtf8String(stream),
					asEditor: readBool(stream),
					admin: readBool(stream),
				}
				break;

			case InputActionType.ServerCommand:
				data = {
					command: readString(stream),
					id: readUInt32(stream),
					connectionID: readBuffer(stream, 8),
				}
				break;

			case InputActionType.PlayerLeaveGame:
			case InputActionType.SelectedEntityChangedVeryClose:
				data = readUInt8(stream);
				break;

			case InputActionType.SelectedEntityChangedVeryClosePrecise:
				data = readUInt16(stream);
				break;

			case InputActionType.SelectedEntityChangedRelative:
			case InputActionType.SelectedEntityChangedBasedOnUnitNumber:
				data = readUInt32(stream);
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

	static write(stream: WritableStream, input: InputAction, lastPlayerIndex: number) {
		writeUInt8(stream, input.type);
		this.writePayload(stream, input, lastPlayerIndex);
	}

	static writePayload(stream: WritableStream, input: InputAction, lastPlayerIndex: number) {
		writeSpaceOptimizedUInt16(stream, input.playerIndex! - lastPlayerIndex & 0xffff);

		switch (input.type) {
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
				if (input.data !== undefined) {
					throw new Error(
						`Attempt to send data with empty input action ${InputActionType[input.type]}`
					);
				}
				break; // No data

			case InputActionType.StartWalking:
				Direction.write(stream, input.data! as Direction);
				break;

			case InputActionType.CheckCRCHeuristic:
			case InputActionType.CheckCRC:
				const crcData = input.data! as CrcData;
				writeUInt32(stream, crcData.crc);
				writeUInt32(stream, crcData.tickOfCrc);
				break;

			case InputActionType.ChangeShootingState:
				const shootingState = input.data! as ShootingState;
				writeUInt8(stream, shootingState.state);
				MapPosition.write(stream, shootingState.target);
				break;

			case InputActionType.PlayerJoinGame:
				const playerJoinData = input.data! as PlayerJoinGameData;
				writeSpaceOptimizedUInt16(stream, playerJoinData.peerID);
				writeUInt16(stream, playerJoinData.playerIndex);
				writeUInt8(stream, playerJoinData.forceID);
				writeUtf8String(stream, playerJoinData.username);
				writeBool(stream, playerJoinData.asEditor);
				writeBool(stream, playerJoinData.admin);
				break;

			case InputActionType.ServerCommand:
				const serverCommandData = input.data! as ServerCommandData;
				writeString(stream, serverCommandData.command);
				writeUInt32(stream, serverCommandData.id);
				writeBuffer(stream, serverCommandData.connectionID);
				break;

			case InputActionType.PlayerLeaveGame:
			case InputActionType.SelectedEntityChangedVeryClose:
				writeUInt8(stream, input.data! as number);
				break;

			case InputActionType.SelectedEntityChangedVeryClosePrecise:
				writeUInt16(stream, input.data! as number);
				break;

			case InputActionType.SelectedEntityChangedRelative:
			case InputActionType.SelectedEntityChangedBasedOnUnitNumber:
				writeUInt32(stream, input.data! as number);
				break;


			default:
				throw new EncodeError(
					`Unknown input action ${InputActionType[input.type]} (${input.type})`,
					{ stream, target: input },
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
			readUInt8(stream),
			readUInt32(stream),
			readSpaceOptimizedUInt16(stream),
			readSpaceOptimizedUInt32(stream),
			readSpaceOptimizedUInt32(stream),
			readString(stream),
		);
	}

	static write(stream: WritableStream, segment: InputActionSegment) {
		writeUInt8(stream, segment.type);
		writeUInt32(stream, segment.id);
		writeSpaceOptimizedUInt16(stream, segment.playerIndex);
		writeSpaceOptimizedUInt32(stream, segment.totalSegments);
		writeSpaceOptimizedUInt32(stream, segment.segmentNumber);
		writeString(stream, segment.payload);
	}
}


