class_name ApartmentBuilder
extends Node3D

const CEILING_HEIGHT := 3.25
const WALL_THICKNESS := 0.16
const HERO_MODEL_ROOT := "res://assets/models/"

var wall_material: StandardMaterial3D
var warm_wood_material: StandardMaterial3D
var pale_stone_material: StandardMaterial3D
var dark_metal_material: StandardMaterial3D
var glass_material: StandardMaterial3D
var appliance_material: StandardMaterial3D
var warm_light_material: StandardMaterial3D
var water_material: StandardMaterial3D


func _ready() -> void:
	_create_materials()
	_build_shell()
	_build_entry_corridor()
	_build_windows()
	_build_distant_city_view()
	_build_doors()
	_build_lighting()
	_build_master_suite_assets()
	_build_kitchen()
	_build_study_rig()
	_build_sofa_interaction()
	_register_food_and_recipes()


func _create_materials() -> void:
	wall_material = _material(Color("e8e1d7"), 0.82)
	warm_wood_material = _material(Color("7d573c"), 0.5)
	pale_stone_material = _material(Color("d9d2c6"), 0.32)
	dark_metal_material = _material(Color("292825"), 0.22, 0.72)
	appliance_material = _material(Color("b9b8b3"), 0.2, 0.8)
	warm_light_material = _material(Color("ffcf91"), 0.28)
	warm_light_material.emission_enabled = true
	warm_light_material.emission = Color("ffd9a5")
	warm_light_material.emission_energy_multiplier = 2.8
	water_material = _material(Color(0.34, 0.68, 0.86, 0.64), 0.12)
	water_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	glass_material = _material(Color(0.48, 0.66, 0.76, 0.2), 0.06, 0.12)
	glass_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	glass_material.cull_mode = BaseMaterial3D.CULL_DISABLED


func _build_shell() -> void:
	# 36 m x 28 m great-room apartment. Windows face the high-rise ocean view (+Z).
	_box(self, "Floor", Vector3(0.0, -0.09, 0.0), Vector3(36.0, 0.18, 28.0), warm_wood_material, true)
	_box(self, "Ceiling", Vector3(0.0, CEILING_HEIGHT + 0.08, 0.0), Vector3(36.0, 0.16, 28.0), wall_material, false)

	# Exterior shell: entrance at the back/right, full-height glazing at the front.
	# Keep the exterior wall closed right up to the 1.45 m entrance leaf.
	# The old 17.2 m segment left an accidental 11 m opening beside the door.
	_wall(Vector3(-3.8, 1.62, -14.0), Vector3(28.4, CEILING_HEIGHT, WALL_THICKNESS))
	_wall(Vector3(15.0, 1.62, -14.0), Vector3(6.0, CEILING_HEIGHT, WALL_THICKNESS))
	_wall(Vector3(-18.0, 1.62, -10.0), Vector3(WALL_THICKNESS, CEILING_HEIGHT, 8.0))
	_wall(Vector3(-18.0, 1.62, 8.3), Vector3(WALL_THICKNESS, CEILING_HEIGHT, 11.4))
	_wall(Vector3(18.0, 1.62, 0.0), Vector3(WALL_THICKNESS, CEILING_HEIGHT, 28.0))

	# Study: large, private and solid-walled, with a wide entrance near the foyer.
	_wall(Vector3(11.0, 1.62, 5.0), Vector3(WALL_THICKNESS, CEILING_HEIGHT, 18.0))
	_wall(Vector3(11.0, 1.62, -12.5), Vector3(WALL_THICKNESS, CEILING_HEIGHT, 3.0))

	# Master suite occupies the entire left wing. Only the bathroom is enclosed.
	_wall(Vector3(-5.0, 1.62, 0.8), Vector3(WALL_THICKNESS, CEILING_HEIGHT, 10.4))
	_wall(Vector3(-5.0, 1.62, 10.8), Vector3(WALL_THICKNESS, CEILING_HEIGHT, 6.4))
	_wall(Vector3(-15.1, 1.62, 8.0), Vector3(5.8, CEILING_HEIGHT, WALL_THICKNESS))
	_wall(Vector3(-8.0, 1.62, 8.0), Vector3(6.0, CEILING_HEIGHT, WALL_THICKNESS))

	# Oversized foyer guides the first left turn into the open kitchen.
	_wall(Vector3(12.5, 1.62, -8.5), Vector3(11.0, CEILING_HEIGHT, WALL_THICKNESS))
	_box(self, "FoyerStone", Vector3(11.8, 0.015, -11.25), Vector3(12.2, 0.04, 5.35), pale_stone_material, false)

	# Concealed linear air-conditioning slots; no wall-mounted AC boxes.
	for x in [-12.0, -2.0, 7.0, 15.0]:
		_box(self, "ConcealedACSlot", Vector3(x, CEILING_HEIGHT - 0.015, 11.8), Vector3(3.8, 0.035, 0.18), dark_metal_material, false)


func _build_entry_corridor() -> void:
	# A sheltered high-rise lift lobby outside the front door. Opening the door
	# must reveal architecture, not the ocean plane or the world background.
	var lobby := Node3D.new()
	lobby.name = "ExteriorLiftLobby"
	add_child(lobby)

	var lobby_stone := _material(Color("bdb8af"), 0.52)
	var lobby_wall := _material(Color("cbc4ba"), 0.78)
	var dark_wood := _material(Color("352a24"), 0.58)
	var brushed_metal := _material(Color("7f817f"), 0.24, 0.72)

	_box(lobby, "LobbyFloor", Vector3(10.55, -0.075, -17.15), Vector3(8.7, 0.15, 6.2), lobby_stone, true)
	_box(lobby, "LobbyCeiling", Vector3(10.55, CEILING_HEIGHT + 0.075, -17.15), Vector3(8.7, 0.15, 6.2), lobby_wall, false)
	_box(lobby, "LobbyLeftWall", Vector3(6.2, 1.62, -17.15), Vector3(0.18, CEILING_HEIGHT, 6.2), lobby_wall, true)
	_box(lobby, "LobbyRightWall", Vector3(14.9, 1.62, -17.15), Vector3(0.18, CEILING_HEIGHT, 6.2), lobby_wall, true)
	_box(lobby, "LobbyEndWall", Vector3(10.55, 1.62, -20.25), Vector3(8.88, CEILING_HEIGHT, 0.18), lobby_wall, true)

	# Recessed elevator portals and realistic wall breaks at the far end.
	for x in [8.45, 12.65]:
		_box(lobby, "ElevatorReveal", Vector3(x, 1.38, -20.14), Vector3(2.25, 2.72, 0.08), dark_wood, false)
		_box(lobby, "ElevatorDoor", Vector3(x, 1.32, -20.08), Vector3(1.86, 2.58, 0.06), brushed_metal, false)
		_box(lobby, "ElevatorSplit", Vector3(x, 1.32, -20.035), Vector3(0.025, 2.48, 0.02), dark_metal_material, false)
		_box(lobby, "ElevatorHeader", Vector3(x, 2.86, -20.03), Vector3(0.74, 0.12, 0.035), dark_metal_material, false)

	# Slim console and artwork make the lobby read as a private residence floor.
	_box(lobby, "LobbyConsole", Vector3(6.48, 0.72, -17.45), Vector3(0.42, 1.15, 2.35), dark_wood, true)
	_box(lobby, "LobbyArtwork", Vector3(6.39, 1.95, -17.45), Vector3(0.05, 1.22, 1.55), warm_wood_material, false)

	for position in [Vector3(8.3, 3.02, -16.2), Vector3(12.8, 3.02, -16.2), Vector3(8.3, 3.02, -19.0), Vector3(12.8, 3.02, -19.0)]:
		var light := _ceiling_light("LobbyDownlight", position, 1.65, 5.2)
		light.shadow_enabled = false


func _build_windows() -> void:
	# Main living glazing, set back from the L sofa to preserve a walkable window promenade.
	for x in [-3.0, 1.0, 5.0, 9.0, 13.0]:
		_box(self, "WindowPane", Vector3(x, 1.62, 13.94), Vector3(3.82, 3.05, 0.045), glass_material, false)
	for x in [-5.0, -1.0, 3.0, 7.0, 11.0, 15.0]:
		_box(self, "WindowMullion", Vector3(x, 1.62, 13.91), Vector3(0.075, 3.25, 0.09), dark_metal_material, true)
	_box(self, "WindowHead", Vector3(5.0, 3.18, 13.91), Vector3(20.2, 0.12, 0.09), dark_metal_material, true)
	_box(self, "WindowSill", Vector3(5.0, 0.06, 13.91), Vector3(20.2, 0.12, 0.09), dark_metal_material, true)

	# Master bedroom has its own side window, looking along the coast.
	for z in [-8.0, -4.0, 0.0, 4.0]:
		_box(self, "BedroomWindow", Vector3(-17.94, 1.62, z), Vector3(0.045, 3.05, 3.82), glass_material, false)
		_box(self, "BedroomMullion", Vector3(-17.91, 1.62, z + 2.0), Vector3(0.09, 3.25, 0.075), dark_metal_material, true)

	# Bathroom glazing is translucent rather than a scenic picture.
	for x in [-16.0, -12.0, -8.0]:
		var frosted := glass_material.duplicate() as StandardMaterial3D
		frosted.albedo_color = Color(0.72, 0.79, 0.8, 0.58)
		frosted.roughness = 0.72
		_box(self, "BathroomFrostedPane", Vector3(x, 1.62, 13.94), Vector3(3.82, 3.05, 0.045), frosted, false)


func _build_distant_city_view() -> void:
	# Procedural coastal geometry gives the high-rise windows a real layered view:
	# water, shore, towers and illuminated facade bands instead of a scenic photograph.
	var city := Node3D.new()
	city.name = "DistantCoastalCity"
	add_child(city)

	var shore_mat := _material(Color("3b4144"), 0.82)
	var facade_dark := _material(Color("303941"), 0.58, 0.18)
	var facade_blue := _material(Color("455663"), 0.50, 0.22)
	var facade_stone := _material(Color("6b675f"), 0.62)
	var crown_mat := _material(Color("292d31"), 0.38, 0.42)
	var city_glow := _material(Color("d6b37b"), 0.24)
	city_glow.emission_enabled = true
	city_glow.emission = Color("ffc77d")
	city_glow.emission_energy_multiplier = 2.15

	_box(city, "CoastalShore", Vector3(0.0, -57.45, 91.0), Vector3(230.0, 1.1, 27.0), shore_mat, false)
	_box(city, "WaterfrontPromenade", Vector3(0.0, -56.72, 77.8), Vector3(230.0, 0.38, 2.8), pale_stone_material, false)

	var towers := [
		Vector4(-101.0, 99.0, 9.0, 48.0), Vector4(-90.0, 108.0, 7.5, 66.0),
		Vector4(-79.0, 94.0, 10.0, 58.0), Vector4(-66.0, 113.0, 8.5, 82.0),
		Vector4(-53.0, 97.0, 11.0, 72.0), Vector4(-39.0, 118.0, 7.0, 94.0),
		Vector4(-28.0, 101.0, 9.5, 61.0), Vector4(-15.0, 110.0, 12.0, 79.0),
		Vector4(0.0, 96.0, 8.0, 57.0), Vector4(12.0, 115.0, 9.0, 88.0),
		Vector4(24.0, 100.0, 11.5, 69.0), Vector4(39.0, 121.0, 7.0, 102.0),
		Vector4(50.0, 103.0, 9.0, 64.0), Vector4(63.0, 111.0, 11.0, 84.0),
		Vector4(78.0, 96.0, 8.0, 55.0), Vector4(89.0, 116.0, 9.5, 76.0),
		Vector4(102.0, 101.0, 10.0, 62.0)
	]
	var facade_materials := [facade_dark, facade_blue, facade_stone]
	for index in range(towers.size()):
		var data: Vector4 = towers[index]
		var depth := 7.0 + float(index % 3) * 1.8
		var body_position := Vector3(data.x, -57.0 + data.w * 0.5, data.y)
		_box(city, "CoastalTower", body_position, Vector3(data.z, data.w, depth), facade_materials[index % facade_materials.size()], false)
		_box(city, "TowerCrown", Vector3(data.x, -56.65 + data.w, data.y), Vector3(data.z * 0.72, 0.70, depth * 0.72), crown_mat, false)
		for floor_index in range(2, int(data.w / 6.0), 3):
			var band_y := -56.0 + float(floor_index) * 5.4
			var band := _box(city, "LitFacadeBand", Vector3(data.x, band_y, data.y - depth * 0.5 - 0.03), Vector3(data.z * 0.72, 0.48, 0.04), city_glow, false)
			band.add_to_group("city_night_emissive")

	# Low waterfront pavilions establish depth before the main skyline.
	for x in [-92.0, -66.0, -40.0, -14.0, 12.0, 38.0, 64.0, 90.0]:
		_box(city, "WaterfrontPavilion", Vector3(x, -53.6, 79.5), Vector3(15.0, 6.8, 7.0), facade_stone, false)
		var pavilion_glow := _box(city, "PavilionGlow", Vector3(x, -52.8, 75.96), Vector3(11.5, 1.15, 0.05), city_glow, false)
		pavilion_glow.add_to_group("city_night_emissive")


func _build_doors() -> void:
	_create_hinged_door("EntranceDoor", Vector3(10.4, 0.0, -13.9), 1.45, 0.0, -92.0)
	_create_hinged_door("StudyDoor", Vector3(11.0, 0.0, -8.35), 1.45, 90.0, 92.0)
	_create_hinged_door("MasterSuiteDoor", Vector3(-5.0, 0.0, 6.1), 1.45, 90.0, -92.0)
	_create_hinged_door("EnsuiteDoor", Vector3(-12.15, 0.0, 8.0), 1.35, 0.0, 92.0)


func _build_lighting() -> void:
	var living_lights: Array[Light3D] = []
	for position in [Vector3(-1.5, 3.02, 3.0), Vector3(4.0, 3.02, 3.0), Vector3(-1.5, 3.02, 8.5), Vector3(4.0, 3.02, 8.5)]:
		living_lights.append(_ceiling_light("LivingDownlight", position, 2.4, 9.0))
	var kitchen_lights: Array[Light3D] = []
	for position in [Vector3(-2.5, 3.02, -9.5), Vector3(2.5, 3.02, -9.5), Vector3(0.0, 3.02, -5.8)]:
		kitchen_lights.append(_ceiling_light("KitchenDownlight", position, 2.6, 8.0))
	var study_lights: Array[Light3D] = []
	for position in [Vector3(14.5, 3.02, -3.0), Vector3(14.5, 3.02, 4.0), Vector3(14.5, 3.02, 10.0)]:
		study_lights.append(_ceiling_light("StudyDownlight", position, 2.1, 8.0))
	_add_light_switch("living_lights", Vector3(7.2, 1.18, -8.36), living_lights)
	_add_light_switch("kitchen_lights", Vector3(5.7, 1.18, -8.36), kitchen_lights)
	_add_light_switch("study_lights", Vector3(11.12, 1.18, -7.3), study_lights)


func _build_kitchen() -> void:
	var kitchen := Node3D.new()
	kitchen.name = "InteractiveKitchen"
	add_child(kitchen)

	# Full L-shaped kitchen run. The island is a bar only and deliberately has no sink.
	_box(kitchen, "BackCabinetRun", Vector3(0.0, 0.46, -12.75), Vector3(10.6, 0.92, 0.72), warm_wood_material, true)
	_box(kitchen, "BackStoneTop", Vector3(0.0, 0.95, -12.75), Vector3(10.7, 0.08, 0.78), pale_stone_material, true)
	_box(kitchen, "LeftCabinetRun", Vector3(-5.0, 0.46, -10.25), Vector3(0.72, 0.92, 5.7), warm_wood_material, true)
	_box(kitchen, "LeftStoneTop", Vector3(-5.0, 0.95, -10.25), Vector3(0.78, 0.08, 5.8), pale_stone_material, true)
	_box(kitchen, "BarBase", Vector3(0.25, 0.5, -6.0), Vector3(5.8, 1.0, 1.12), warm_wood_material, true)
	_box(kitchen, "BarStone", Vector3(0.25, 1.04, -6.0), Vector3(6.1, 0.09, 1.34), pale_stone_material, true)
	for x in [-1.7, -0.4, 0.9, 2.2]:
		_add_bar_stool(kitchen, Vector3(x, 0.0, -4.95))

	_create_refrigerator(kitchen, Vector3(4.05, 0.0, -12.15))
	_create_sink(kitchen, Vector3(-2.2, 0.0, -12.55))
	_create_stove(kitchen, Vector3(1.0, 0.0, -12.55))


func _build_study_rig() -> void:
	var study := Node3D.new()
	study.name = "StudyInteractionRig"
	add_child(study)
	var has_authored_study := _instantiate_hero_asset(
		study,
		"executive_study_rig.glb",
		Vector3(14.35, 0.0, 3.0),
		0.0
	)
	if has_authored_study:
		_collision_box(study, "ExecutiveDeskCollision", Vector3(14.35, 0.44, 3.0), Vector3(3.9, 0.88, 1.3))
	else:
		# Offline authoring fallback. The shipped cloud build uses the GLB above.
		_box(study, "DeskTop", Vector3(14.35, 0.78, 3.0), Vector3(3.8, 0.12, 1.35), warm_wood_material, true)
		for x in [12.75, 15.95]:
			_box(study, "DeskLeg", Vector3(x, 0.39, 3.0), Vector3(0.16, 0.78, 1.1), dark_metal_material, true)
		_box(study, "ComputerScreen", Vector3(14.35, 1.35, 2.82), Vector3(1.45, 0.82, 0.07), dark_metal_material, false)
	var computer := ComputerInteractable.new()
	computer.name = "StudyComputer"
	computer.object_id = "study_computer"
	computer.position = Vector3(14.35, 1.35, 2.55)
	computer.add_child(_area_shape(Vector3(1.8, 1.4, 1.0)))
	study.add_child(computer)

	var chair_anchor := Node3D.new()
	chair_anchor.name = "StudyChairAnchor"
	chair_anchor.position = Vector3(14.35, 0.02, 4.18)
	study.add_child(chair_anchor)
	var chair_seat := SeatInteractable.new()
	chair_seat.name = "ExecutiveStudyChairSeat"
	chair_seat.object_id = "executive_study_chair"
	chair_seat.display_name = "study chair"
	chair_seat.seat_anchor = chair_anchor
	chair_seat.position = Vector3(14.35, 0.65, 4.18)
	chair_seat.add_child(_area_shape(Vector3(0.95, 1.25, 0.95)))
	study.add_child(chair_seat)


func _build_master_suite_assets() -> void:
	var suite := Node3D.new()
	suite.name = "AuthoredMasterSuite"
	add_child(suite)

	if _instantiate_hero_asset(suite, "upholstered_bed.glb", Vector3(-11.45, 0.0, -7.2), 0.0):
		_collision_box(suite, "MasterBedCollision", Vector3(-11.45, 0.42, -7.2), Vector3(2.45, 0.84, 2.55))
	else:
		_build_bed_fallback(suite)
	_build_bed_interaction(suite)

	if _instantiate_hero_asset(suite, "walk_in_wardrobe.glb", Vector3(-11.45, 0.0, 3.45), 0.0):
		_collision_box(suite, "WardrobeBackCollision", Vector3(-11.45, 1.32, 1.50), Vector3(5.85, 2.64, 0.48))
		_collision_box(suite, "WardrobeLeftCollision", Vector3(-14.12, 1.32, 3.45), Vector3(0.48, 2.64, 4.35))
		_collision_box(suite, "WardrobeRightCollision", Vector3(-8.78, 1.32, 3.45), Vector3(0.48, 2.64, 4.35))
		_collision_box(suite, "DressingIslandCollision", Vector3(-11.45, 0.52, 3.85), Vector3(2.08, 1.04, 0.95))
	else:
		_build_wardrobe_fallback(suite)
	_build_wardrobe_interaction(suite)

	if _instantiate_hero_asset(suite, "bathroom_suite.glb", Vector3(-11.45, 0.0, 11.0), 0.0):
		_collision_box(suite, "BathCollision", Vector3(-15.17, 0.48, 10.75), Vector3(2.55, 0.96, 1.45))
		_collision_box(suite, "VanityCollision", Vector3(-11.45, 0.62, 10.28), Vector3(3.60, 1.24, 0.85))
		_collision_box(suite, "ToiletCollision", Vector3(-9.20, 0.55, 10.42), Vector3(0.95, 1.10, 1.25))
		_collision_box(suite, "ShowerCollision", Vector3(-7.80, 1.20, 10.90), Vector3(1.78, 2.40, 1.60))
	else:
		_build_bathroom_fallback(suite)


func _build_bed_interaction(parent: Node3D) -> void:
	var anchor := Node3D.new()
	anchor.name = "MasterBedSeatAnchor"
	anchor.position = Vector3(-11.45, 0.02, -6.02)
	anchor.rotation_degrees.y = 180.0
	parent.add_child(anchor)

	var seat := SeatInteractable.new()
	seat.name = "MasterBedSeat"
	seat.object_id = "master_bed_seat"
	seat.display_name = "bed edge"
	seat.camera_height = 1.08
	seat.seat_anchor = anchor
	seat.position = Vector3(-11.45, 0.72, -6.05)
	seat.add_child(_area_shape(Vector3(2.18, 1.35, 1.05)))
	parent.add_child(seat)


func _build_bed_fallback(parent: Node3D) -> void:
	_box(parent, "BedFrameFallback", Vector3(-11.45, 0.32, -7.2), Vector3(2.35, 0.48, 2.45), dark_metal_material, true)
	_box(parent, "BedMattressFallback", Vector3(-11.45, 0.67, -7.2), Vector3(2.10, 0.32, 2.22), wall_material, true)
	_box(parent, "BedHeadboardFallback", Vector3(-11.45, 1.28, -8.32), Vector3(2.72, 1.72, 0.20), dark_metal_material, true)


func _build_wardrobe_interaction(parent: Node3D) -> void:
	var drawer_part := Node3D.new()
	drawer_part.name = "DressingIslandDrawer"
	drawer_part.position = Vector3(-11.45, 0.67, 3.34)
	parent.add_child(drawer_part)
	_box(drawer_part, "DrawerFront", Vector3.ZERO, Vector3(1.52, 0.34, 0.08), warm_wood_material, false)
	_box(drawer_part, "DrawerHandle", Vector3(0.0, 0.0, -0.065), Vector3(0.48, 0.035, 0.035), dark_metal_material, false)

	var drawer := OpenableInteractable.new()
	drawer.name = "DressingDrawerInteraction"
	drawer.object_id = "master_wardrobe_dressing_drawer"
	drawer.moving_part = drawer_part
	drawer.motion_type = OpenableInteractable.MotionType.DRAWER
	drawer.open_offset = Vector3(0.0, 0.0, -0.46)
	drawer.open_rotation_degrees = Vector3.ZERO
	drawer.motion_seconds = 0.55
	drawer.open_label = "Open dressing drawer"
	drawer.close_label = "Close dressing drawer"
	drawer.position = Vector3(-11.45, 0.68, 3.12)
	drawer.add_child(_area_shape(Vector3(1.95, 0.92, 0.85)))
	parent.add_child(drawer)


func _build_wardrobe_fallback(parent: Node3D) -> void:
	_box(parent, "WardrobeBackFallback", Vector3(-11.45, 1.32, 1.50), Vector3(5.85, 2.64, 0.48), warm_wood_material, true)
	_box(parent, "WardrobeLeftFallback", Vector3(-14.12, 1.32, 3.45), Vector3(0.48, 2.64, 4.35), warm_wood_material, true)
	_box(parent, "WardrobeRightFallback", Vector3(-8.78, 1.32, 3.45), Vector3(0.48, 2.64, 4.35), warm_wood_material, true)
	_box(parent, "DressingIslandFallback", Vector3(-11.45, 0.52, 3.85), Vector3(2.08, 1.04, 0.95), warm_wood_material, true)


func _build_bathroom_fallback(parent: Node3D) -> void:
	_box(parent, "VanityFallback", Vector3(-11.45, 0.62, 10.28), Vector3(3.60, 1.24, 0.85), pale_stone_material, true)
	_box(parent, "ShowerFallback", Vector3(-7.80, 1.20, 10.90), Vector3(1.78, 2.40, 1.60), glass_material, true)


func _build_sofa_interaction() -> void:
	# The visible sofa is the authored GLB in boot.tscn; this is only its interaction volume.
	var anchor := Node3D.new()
	anchor.name = "SofaSeatAnchor"
	anchor.position = Vector3(0.1, 0.02, 4.1)
	anchor.rotation_degrees.y = 180.0
	add_child(anchor)
	var seat := SeatInteractable.new()
	seat.name = "HeroSectionalSeat"
	seat.object_id = "living_sectional_seat"
	seat.display_name = "sectional"
	seat.seat_anchor = anchor
	seat.position = Vector3(0.1, 0.65, 4.1)
	seat.add_child(_area_shape(Vector3(4.8, 1.3, 2.0)))
	add_child(seat)


func _create_refrigerator(parent: Node3D, origin: Vector3) -> void:
	var fridge := Node3D.new()
	fridge.name = "FrenchDoorRefrigerator"
	fridge.position = origin
	parent.add_child(fridge)
	_box(fridge, "FridgeBody", Vector3(0.0, 1.12, 0.0), Vector3(1.72, 2.24, 0.82), appliance_material, true)
	_box(fridge, "DarkInterior", Vector3(0.0, 1.26, 0.43), Vector3(1.52, 1.64, 0.05), dark_metal_material, false)
	for y in [0.72, 1.15, 1.58]:
		_box(fridge, "GlassShelf", Vector3(0.0, y, 0.48), Vector3(1.48, 0.025, 0.55), glass_material, false)

	var left_hinge := Node3D.new()
	left_hinge.name = "LeftDoorHinge"
	left_hinge.position = Vector3(-0.84, 1.38, 0.47)
	fridge.add_child(left_hinge)
	_box(left_hinge, "LeftDoor", Vector3(0.42, 0.0, 0.0), Vector3(0.82, 1.58, 0.09), appliance_material, true)
	_box(left_hinge, "LeftHandle", Vector3(0.72, 0.0, 0.09), Vector3(0.035, 0.9, 0.055), dark_metal_material, false)

	var right_hinge := Node3D.new()
	right_hinge.name = "RightDoorHinge"
	right_hinge.position = Vector3(0.84, 1.38, 0.47)
	fridge.add_child(right_hinge)
	_box(right_hinge, "RightDoor", Vector3(-0.42, 0.0, 0.0), Vector3(0.82, 1.58, 0.09), appliance_material, true)
	_box(right_hinge, "RightHandle", Vector3(-0.72, 0.0, 0.09), Vector3(0.035, 0.9, 0.055), dark_metal_material, false)
	_box(fridge, "FreezerDrawer", Vector3(0.0, 0.34, 0.47), Vector3(1.66, 0.58, 0.09), appliance_material, true)

	var interior_light := OmniLight3D.new()
	interior_light.name = "InteriorLight"
	interior_light.position = Vector3(0.0, 1.75, 0.52)
	interior_light.light_color = Color("fff0d5")
	interior_light.light_energy = 0.0
	interior_light.omni_range = 2.2
	fridge.add_child(interior_light)

	var interaction := FridgeInteractable.new()
	interaction.name = "RefrigeratorInteraction"
	interaction.object_id = "kitchen_refrigerator"
	interaction.left_door = left_hinge
	interaction.right_door = right_hinge
	interaction.interior_light = interior_light
	interaction.position = Vector3(0.0, 1.2, 0.75)
	interaction.add_child(_area_shape(Vector3(2.1, 2.4, 1.0)))
	fridge.add_child(interaction)


func _create_sink(parent: Node3D, origin: Vector3) -> void:
	var sink := Node3D.new()
	sink.name = "InteractiveSink"
	sink.position = origin
	parent.add_child(sink)
	_box(sink, "SinkBasin", Vector3(0.0, 0.98, 0.0), Vector3(1.3, 0.08, 0.52), dark_metal_material, false)
	_box(sink, "FaucetStem", Vector3(0.0, 1.28, -0.18), Vector3(0.06, 0.58, 0.06), dark_metal_material, false)
	_box(sink, "FaucetSpout", Vector3(0.0, 1.55, 0.02), Vector3(0.06, 0.06, 0.42), dark_metal_material, false)
	var stream := MeshInstance3D.new()
	stream.name = "WaterStream"
	var stream_mesh := CylinderMesh.new()
	stream_mesh.top_radius = 0.018
	stream_mesh.bottom_radius = 0.026
	stream_mesh.height = 0.5
	stream_mesh.radial_segments = 12
	stream_mesh.material = water_material
	stream.mesh = stream_mesh
	stream.position = Vector3(0.0, 1.24, 0.21)
	stream.visible = false
	sink.add_child(stream)
	var faucet := FaucetInteractable.new()
	faucet.name = "FaucetInteraction"
	faucet.object_id = "kitchen_faucet"
	faucet.water_stream = stream
	faucet.position = Vector3(0.0, 1.3, 0.3)
	faucet.add_child(_area_shape(Vector3(1.4, 1.1, 0.9)))
	sink.add_child(faucet)


func _create_stove(parent: Node3D, origin: Vector3) -> void:
	var stove := Node3D.new()
	stove.name = "InductionStove"
	stove.position = origin
	parent.add_child(stove)
	var cooktop := _box(stove, "Cooktop", Vector3(0.0, 1.01, 0.0), Vector3(1.45, 0.035, 0.62), dark_metal_material, false)
	for x in [-0.42, 0.42]:
		for z in [-0.17, 0.17]:
			var ring := MeshInstance3D.new()
			var ring_mesh := TorusMesh.new()
			ring_mesh.inner_radius = 0.16
			ring_mesh.outer_radius = 0.185
			ring_mesh.material = warm_light_material.duplicate()
			ring.mesh = ring_mesh
			ring.position = Vector3(x, 1.035, z)
			stove.add_child(ring)
	var appliance := ApplianceInteractable.new()
	appliance.name = "StoveInteraction"
	appliance.object_id = "kitchen_stove"
	appliance.appliance_id = "induction_stove"
	appliance.display_name = "Induction stove"
	appliance.active_emissive_mesh = cooktop
	appliance.position = Vector3(0.0, 1.2, 0.35)
	appliance.add_child(_area_shape(Vector3(1.8, 1.0, 0.95)))
	stove.add_child(appliance)


func _register_food_and_recipes() -> void:
	var foods := [
		_food("egg", "Free-range egg", false, false),
		_food("tomato", "Tomato", true, true),
		_food("salmon", "Salmon fillet", true, false),
		_food("pasta", "Fresh pasta", false, false),
	]
	for food in foods:
		Kitchen.register_food(food)
	var tomato_egg := RecipeDefinition.new()
	tomato_egg.id = "tomato_egg"
	tomato_egg.display_name = "Tomato and egg"
	tomato_egg.required_ingredients = ["tomato", "egg"]
	tomato_egg.appliance = "induction_stove"
	tomato_egg.cook_seconds = 6.0
	Kitchen.register_recipe(tomato_egg)
	var salmon := RecipeDefinition.new()
	salmon.id = "seared_salmon"
	salmon.display_name = "Pan-seared salmon"
	salmon.required_ingredients = ["salmon"]
	salmon.appliance = "induction_stove"
	salmon.cook_seconds = 8.0
	Kitchen.register_recipe(salmon)
	if AppState.inventory.is_empty():
		for id in ["egg", "tomato", "salmon", "pasta"]:
			Kitchen.create_food(id, "fridge")


func _food(id: String, display_name: String, can_wash: bool, can_chop: bool) -> FoodDefinition:
	var food := FoodDefinition.new()
	food.id = id
	food.display_name = display_name
	food.can_wash = can_wash
	food.can_chop = can_chop
	food.default_location = "fridge"
	return food


func _create_hinged_door(id: String, hinge_position: Vector3, width: float, rotation_y: float, open_degrees: float) -> void:
	var hinge := Node3D.new()
	hinge.name = "%sLeaf" % id
	hinge.position = hinge_position
	hinge.rotation_degrees.y = rotation_y
	add_child(hinge)
	_box(hinge, "DoorPanel", Vector3(width * 0.5, 1.2, 0.0), Vector3(width, 2.4, 0.085), warm_wood_material, true)
	_box(hinge, "DoorHandle", Vector3(width - 0.16, 1.08, 0.08), Vector3(0.055, 0.055, 0.16), dark_metal_material, false)
	var interaction := DoorInteractable.new()
	interaction.name = "%sInteraction" % id
	interaction.object_id = String(id).to_snake_case()
	interaction.door_leaf = hinge
	interaction.open_degrees = open_degrees
	interaction.position = hinge_position + Vector3(0.0, 1.2, 0.0)
	interaction.add_child(_area_shape(Vector3(2.3, 2.5, 2.3)))
	add_child(interaction)


func _add_light_switch(id: String, position: Vector3, lights: Array[Light3D]) -> void:
	_box(self, "%sPlate" % id, position, Vector3(0.16, 0.24, 0.035), pale_stone_material, false)
	var interaction := LightSwitchInteractable.new()
	interaction.name = "%sSwitch" % id
	interaction.object_id = id
	interaction.target_lights = lights
	interaction.position = position
	interaction.add_child(_area_shape(Vector3(0.65, 0.75, 0.45)))
	add_child(interaction)


func _ceiling_light(id: String, position: Vector3, energy: float, light_range: float) -> OmniLight3D:
	var light := OmniLight3D.new()
	light.name = id
	light.position = position
	light.light_color = Color("ffd9a5")
	light.light_energy = energy
	light.omni_range = light_range
	light.shadow_enabled = true
	add_child(light)
	_box(self, "%sTrim" % id, position + Vector3(0.0, 0.08, 0.0), Vector3(0.22, 0.04, 0.22), warm_light_material, false)
	return light


func _add_bar_stool(parent: Node3D, position: Vector3) -> void:
	var stool := Node3D.new()
	stool.name = "BarStool"
	stool.position = position
	parent.add_child(stool)
	var seat_material := _material(Color("4d4540"), 0.78)
	var seat := MeshInstance3D.new()
	var seat_mesh := CylinderMesh.new()
	seat_mesh.top_radius = 0.26
	seat_mesh.bottom_radius = 0.26
	seat_mesh.height = 0.12
	seat_mesh.radial_segments = 32
	seat_mesh.material = seat_material
	seat.mesh = seat_mesh
	seat.position.y = 0.74
	stool.add_child(seat)
	_box(stool, "Stem", Vector3(0.0, 0.36, 0.0), Vector3(0.055, 0.72, 0.055), dark_metal_material, true)
	_box(stool, "Foot", Vector3(0.0, 0.04, 0.0), Vector3(0.48, 0.05, 0.48), dark_metal_material, true)


func _wall(position: Vector3, size: Vector3) -> void:
	_box(self, "Wall", position, size, wall_material, true)


func _instantiate_hero_asset(parent: Node3D, filename: String, position: Vector3, rotation_y: float) -> bool:
	var path := HERO_MODEL_ROOT + filename
	if not ResourceLoader.exists(path):
		return false
	var resource := ResourceLoader.load(path)
	if not resource is PackedScene:
		push_warning("DearV hero asset is not a PackedScene: %s" % path)
		return false
	var instance := (resource as PackedScene).instantiate() as Node3D
	if not instance:
		return false
	instance.name = filename.get_basename().to_pascal_case()
	instance.position = position
	instance.rotation_degrees.y = rotation_y
	parent.add_child(instance)
	return true


func _collision_box(parent: Node3D, node_name: String, position: Vector3, size: Vector3) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.name = node_name
	body.position = position
	var shape_node := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	shape_node.shape = shape
	body.add_child(shape_node)
	parent.add_child(body)
	return body


func _box(parent: Node3D, node_name: String, position: Vector3, size: Vector3, material: Material, collision: bool) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	instance.name = node_name
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh.material = material
	instance.mesh = mesh
	instance.position = position
	parent.add_child(instance)
	if collision:
		var body := StaticBody3D.new()
		body.name = "%sCollision" % node_name
		body.position = position
		var shape_node := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = size
		shape_node.shape = shape
		body.add_child(shape_node)
		parent.add_child(body)
	return instance


func _area_shape(size: Vector3) -> CollisionShape3D:
	var node := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	node.shape = shape
	return node


func _material(color: Color, roughness: float, metallic := 0.0) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = roughness
	material.metallic = metallic
	return material
