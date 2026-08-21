class_name PremiumDecor
extends Node3D

var cream := StandardMaterial3D.new()
var walnut := StandardMaterial3D.new()
var champagne := StandardMaterial3D.new()
var textile := StandardMaterial3D.new()
var charcoal := StandardMaterial3D.new()
var mirror := StandardMaterial3D.new()
var warm_glow := StandardMaterial3D.new()
var ceramic := StandardMaterial3D.new()
var leaf_dark := StandardMaterial3D.new()
var leaf_light := StandardMaterial3D.new()

var living_detail_lights: Array[Light3D] = []
var kitchen_detail_lights: Array[Light3D] = []
var study_detail_lights: Array[Light3D] = []
var suite_detail_lights: Array[Light3D] = []
var bathroom_detail_lights: Array[Light3D] = []


func _ready() -> void:
	_setup_materials()
	_build_master_bedroom()
	_build_walk_in_wardrobe()
	_build_study()
	_build_living_details()
	_build_bathroom_details()
	_build_kitchen_details()
	_build_dining_room()
	_build_entry_gallery()
	_build_private_light_switches()
	call_deferred("_link_shared_zone_lights")


func _setup_materials() -> void:
	cream.albedo_color = Color("e7dfd3")
	cream.roughness = 0.86
	walnut.albedo_color = Color("4c3428")
	walnut.roughness = 0.48
	champagne.albedo_color = Color("b99666")
	champagne.roughness = 0.28
	champagne.metallic = 0.72
	textile.albedo_color = Color("776d65")
	textile.roughness = 0.94
	charcoal.albedo_color = Color("24211f")
	charcoal.roughness = 0.62
	mirror.albedo_color = Color(0.58, 0.66, 0.7, 0.42)
	mirror.metallic = 0.86
	mirror.roughness = 0.08
	warm_glow.albedo_color = Color("ffd7a4")
	warm_glow.roughness = 0.22
	warm_glow.emission_enabled = true
	warm_glow.emission = Color("ffc67e")
	warm_glow.emission_energy_multiplier = 2.25
	ceramic.albedo_color = Color("d9cfc0")
	ceramic.roughness = 0.38
	leaf_dark.albedo_color = Color("25463b")
	leaf_dark.roughness = 0.78
	leaf_light.albedo_color = Color("4f725c")
	leaf_light.roughness = 0.82


func _build_master_bedroom() -> void:
	var root := Node3D.new()
	root.name = "MasterBedroomLayer"
	add_child(root)

	# Oversized textile rug anchors the bed instead of leaving it floating on the timber floor.
	_box(root, "BedroomRug", Vector3(-11.45, 0.018, -6.75), Vector3(5.6, 0.028, 4.5), textile)
	_box(root, "HeadboardWallPanel", Vector3(-11.45, 1.72, -8.73), Vector3(6.4, 2.75, 0.08), walnut)
	for x in [-13.62, -9.28]:
		_box(root, "BedsideCabinet", Vector3(x, 0.36, -7.85), Vector3(0.82, 0.72, 0.58), walnut)
		_add_collision_box(root, "BedsideCabinetCollision", Vector3(x, 0.36, -7.85), Vector3(0.82, 0.72, 0.58))
		_box(root, "BedsideTop", Vector3(x, 0.74, -7.85), Vector3(0.88, 0.045, 0.62), champagne)
		suite_detail_lights.append(_add_table_lamp(root, Vector3(x, 0.78, -7.85)))

	# A restrained upholstered bench makes the foot of the bed read as a real hotel-like suite.
	_box(root, "BedroomBenchSeat", Vector3(-11.45, 0.45, -5.34), Vector3(2.15, 0.34, 0.62), cream)
	for x in [-12.28, -10.62]:
		_box(root, "BedroomBenchLeg", Vector3(x, 0.22, -5.34), Vector3(0.08, 0.44, 0.46), champagne)
	_add_collision_box(root, "BedroomBenchCollision", Vector3(-11.45, 0.38, -5.34), Vector3(2.15, 0.76, 0.62))
	_add_seat_interaction(root, "bedroom_bench_seat", "bedroom bench", Vector3(-11.45, 0.02, -4.98), 0.0, Vector3(2.10, 1.25, 0.86))

	# Art is intentionally abstract/system-authored; it does not invent personal copy.
	_box(root, "BedroomArtFrame", Vector3(-14.55, 1.72, -8.64), Vector3(1.0, 1.28, 0.055), champagne)
	_box(root, "BedroomArtCanvas", Vector3(-14.55, 1.72, -8.59), Vector3(0.86, 1.14, 0.03), cream)

	# A leafy corner and a soft folded throw keep the suite from reading as a showroom.
	_add_plant(root, Vector3(-14.30, 0.0, -5.35), 0.84)
	_box(root, "BenchThrow", Vector3(-11.78, 0.64, -5.34), Vector3(0.74, 0.035, 0.58), textile)
	suite_detail_lights.append(_add_warm_spot(root, Vector3(-11.45, 2.95, -6.2), Vector3(-11.45, 0.8, -7.2), 1.55, 5.5))


func _build_walk_in_wardrobe() -> void:
	var root := Node3D.new()
	root.name = "WardrobeLayer"
	add_child(root)

	_box(root, "WardrobeRunner", Vector3(-11.45, 0.02, 3.5), Vector3(3.25, 0.025, 4.75), cream)
	_box(root, "DressingIslandGlassTop", Vector3(-11.45, 1.055, 3.85), Vector3(2.02, 0.035, 0.91), mirror)
	for x in [-12.28, -11.45, -10.62]:
		_box(root, "IslandDrawerLine", Vector3(x, 0.70, 3.37), Vector3(0.025, 0.36, 0.025), champagne)

	# Full-length dressing mirror with a subtle warm halo.
	_box(root, "WardrobeMirrorFrame", Vector3(-8.49, 1.45, 5.25), Vector3(0.07, 2.45, 1.35), champagne)
	_box(root, "WardrobeMirror", Vector3(-8.44, 1.45, 5.25), Vector3(0.025, 2.29, 1.19), mirror)
	for y in [0.45, 1.1, 1.75, 2.4]:
		_box(root, "MirrorGlow", Vector3(-8.40, y, 4.60), Vector3(0.03, 0.035, 0.16), warm_glow)
		_box(root, "MirrorGlow", Vector3(-8.40, y, 5.90), Vector3(0.03, 0.035, 0.16), warm_glow)

	# A small perfume grouping adds human scale without inventing personal belongings.
	_cylinder(root, "PerfumeBottleTall", Vector3(-11.72, 1.18, 3.72), 0.055, 0.065, 0.22, mirror)
	_sphere(root, "PerfumeCapTall", Vector3(-11.72, 1.32, 3.72), Vector3(0.045, 0.045, 0.045), champagne)
	_cylinder(root, "PerfumeBottleRound", Vector3(-11.50, 1.16, 3.78), 0.085, 0.095, 0.16, ceramic)
	_sphere(root, "PerfumeCapRound", Vector3(-11.50, 1.27, 3.78), Vector3(0.042, 0.042, 0.042), champagne)

	# Small dressing stool rather than another large block.
	_box(root, "DressingStoolSeat", Vector3(-11.45, 0.48, 5.15), Vector3(0.92, 0.22, 0.58), cream)
	for x in [-11.78, -11.12]:
		_box(root, "DressingStoolLeg", Vector3(x, 0.24, 5.15), Vector3(0.055, 0.48, 0.42), champagne)
	_add_collision_box(root, "DressingStoolCollision", Vector3(-11.45, 0.38, 5.15), Vector3(0.92, 0.76, 0.58))
	_add_seat_interaction(root, "dressing_stool_seat", "dressing stool", Vector3(-11.45, 0.02, 5.15), 0.0, Vector3(0.98, 1.15, 0.76))

	suite_detail_lights.append(_add_warm_spot(root, Vector3(-11.45, 3.02, 3.72), Vector3(-11.45, 0.75, 3.85), 1.4, 4.8))


func _build_study() -> void:
	var root := Node3D.new()
	root.name = "ExecutiveStudyLayer"
	add_child(root)

	_box(root, "StudyRug", Vector3(14.25, 0.018, 3.25), Vector3(5.35, 0.028, 4.25), charcoal)

	# Tall walnut library wall, broken into bays so it reads as cabinetry rather than one primitive slab.
	for z in [-2.5, 0.3, 6.0, 8.8]:
		_box(root, "LibraryBay", Vector3(17.55, 1.42, z), Vector3(0.58, 2.84, 2.28), walnut)
		for y in [0.52, 1.15, 1.78, 2.41]:
			_box(root, "LibraryShelf", Vector3(17.20, y, z), Vector3(0.12, 0.055, 2.05), champagne)
	# Abstract book spines with restrained palette.
	var book_colors := [Color("7e6655"), Color("c2b09a"), Color("36312d"), Color("9a7a5d")]
	var index := 0
	for z in [-3.15, -2.75, -2.35, -1.95, 5.35, 5.75, 6.15, 6.55]:
		var mat := StandardMaterial3D.new()
		mat.albedo_color = book_colors[index % book_colors.size()]
		mat.roughness = 0.82
		_box(root, "BookSpine", Vector3(17.08, 1.42 + float(index % 3) * 0.12, z), Vector3(0.16, 0.48, 0.22), mat)
		index += 1

	# Desk accessories and a pool of task light make the authored GLB feel inhabited.
	_box(root, "DeskPad", Vector3(14.35, 0.855, 3.0), Vector3(1.65, 0.025, 0.72), charcoal)
	_box(root, "PenTray", Vector3(15.43, 0.88, 2.75), Vector3(0.42, 0.05, 0.18), champagne)
	study_detail_lights.append(_add_table_lamp(root, Vector3(13.05, 0.83, 2.62), 0.82))
	# A restrained desk globe brings a curved silhouette to the executive study.
	_cylinder(root, "GlobeStand", Vector3(15.18, 1.00, 3.26), 0.09, 0.13, 0.18, champagne)
	_sphere(root, "DeskGlobe", Vector3(15.18, 1.20, 3.26), Vector3(0.18, 0.18, 0.18), mirror)
	_sphere(root, "GlobeAxisCap", Vector3(15.18, 1.40, 3.26), Vector3(0.035, 0.035, 0.035), champagne)
	study_detail_lights.append(_add_warm_spot(root, Vector3(14.35, 2.98, 3.15), Vector3(14.35, 0.75, 3.0), 1.35, 5.0))


func _build_entry_gallery() -> void:
	var root := Node3D.new()
	root.name = "EntryGalleryLayer"
	add_child(root)

	# A calm arrival sequence bridges the private lift lobby and the open-plan home.
	_box(root, "EntryRunner", Vector3(11.15, 0.042, -11.45), Vector3(3.55, 0.035, 2.20), textile)

	# Slim console and circular mirror form the first focal point without narrowing the route.
	_box(root, "EntryConsole", Vector3(17.48, 0.63, -11.20), Vector3(0.52, 1.18, 2.35), walnut)
	_box(root, "EntryConsoleTop", Vector3(17.45, 1.24, -11.20), Vector3(0.62, 0.055, 2.48), champagne)
	_add_collision_box(root, "EntryConsoleCollision", Vector3(17.48, 0.63, -11.20), Vector3(0.52, 1.18, 2.35))

	# A shallow valet drawer keeps keys and small private items out of sight.
	var valet_drawer_part := Node3D.new()
	valet_drawer_part.name = "EntryValetDrawer"
	root.add_child(valet_drawer_part)
	_box(valet_drawer_part, "ValetDrawerFront", Vector3(17.18, 0.82, -11.20), Vector3(0.055, 0.30, 1.62), walnut)
	_box(valet_drawer_part, "ValetDrawerPull", Vector3(17.13, 0.82, -11.20), Vector3(0.028, 0.035, 0.48), champagne)

	var valet_drawer := OpenableInteractable.new()
	valet_drawer.name = "EntryValetDrawerInteraction"
	valet_drawer.object_id = "entry_valet_drawer"
	valet_drawer.moving_part = valet_drawer_part
	valet_drawer.motion_type = OpenableInteractable.MotionType.DRAWER
	valet_drawer.open_offset = Vector3(-0.42, 0.0, 0.0)
	valet_drawer.open_rotation_degrees = Vector3.ZERO
	valet_drawer.motion_seconds = 0.5
	valet_drawer.open_label = "Open entry valet drawer"
	valet_drawer.close_label = "Close entry valet drawer"
	valet_drawer.position = Vector3(16.92, 0.82, -11.20)
	valet_drawer.add_child(_area_shape(Vector3(0.65, 0.72, 1.82)))
	root.add_child(valet_drawer)

	var mirror_frame := _cylinder(root, "EntryMirrorFrame", Vector3(17.70, 2.10, -11.20), 0.70, 0.70, 0.07, champagne)
	mirror_frame.rotation_degrees.z = 90.0
	var mirror_face := _cylinder(root, "EntryMirror", Vector3(17.65, 2.10, -11.20), 0.61, 0.61, 0.035, mirror)
	mirror_face.rotation_degrees.z = 90.0

	# Small objects make the console useful while remaining intentionally impersonal.
	_cylinder(root, "EntryCatchall", Vector3(17.10, 1.30, -11.52), 0.18, 0.20, 0.035, ceramic, Vector3(1.0, 1.0, 0.70))
	_sphere(root, "EntrySculpture", Vector3(17.10, 1.47, -10.78), Vector3(0.14, 0.24, 0.14), pale_stone())

	# A discreet console tablet lets the resident set the home's daylight mood.
	_box(root, "AtmosphereTablet", Vector3(17.08, 1.30, -11.92), Vector3(0.44, 0.035, 0.30), charcoal)
	for z in [-12.00, -11.92, -11.84]:
		_box(root, "AtmospherePresetKey", Vector3(17.08, 1.325, z), Vector3(0.30, 0.012, 0.035), warm_glow)
	var atmosphere := AtmosphereInteractable.new()
	atmosphere.name = "AtmosphereInteraction"
	atmosphere.object_id = "home_atmosphere_control"
	atmosphere.position = Vector3(17.08, 1.48, -11.92)
	atmosphere.add_child(_area_shape(Vector3(0.72, 0.70, 0.72)))
	root.add_child(atmosphere)

	# Upholstered perch and planting soften the solid study wall near the turn into the home.
	_box(root, "EntryBenchSeat", Vector3(14.55, 0.48, -8.88), Vector3(2.25, 0.28, 0.54), cream)
	for x in [13.75, 15.35]:
		_box(root, "EntryBenchLeg", Vector3(x, 0.23, -8.88), Vector3(0.07, 0.46, 0.42), champagne)
	_add_collision_box(root, "EntryBenchCollision", Vector3(14.55, 0.38, -8.88), Vector3(2.25, 0.76, 0.54))
	_add_seat_interaction(root, "entry_bench_seat", "entry bench", Vector3(14.55, 0.02, -9.18), 0.0, Vector3(2.15, 1.25, 0.82))
	_add_plant(root, Vector3(16.65, 0.0, -9.35), 0.66)

	living_detail_lights.append(_add_warm_spot(root, Vector3(16.85, 3.02, -11.20), Vector3(17.20, 1.15, -11.20), 1.20, 4.0))
	living_detail_lights.append(_add_warm_spot(root, Vector3(14.55, 3.02, -9.40), Vector3(14.55, 0.55, -8.88), 1.05, 4.2))


func _build_dining_room() -> void:
	var root := Node3D.new()
	root.name = "DiningRoomLayer"
	add_child(root)

	var center := Vector3(6.15, 0.0, -1.15)
	_box(root, "DiningRug", center + Vector3(0.0, 0.018, 0.0), Vector3(4.35, 0.028, 3.15), textile)
	_cylinder(root, "DiningTableTop", center + Vector3(0.0, 0.79, 0.0), 0.92, 0.92, 0.11, pale_stone(), Vector3(1.62, 1.0, 0.66))
	_cylinder(root, "DiningPedestal", center + Vector3(0.0, 0.39, 0.0), 0.34, 0.52, 0.78, walnut, Vector3(1.15, 1.0, 0.82))
	_add_collision_box(root, "DiningTableCollision", center + Vector3(0.0, 0.44, 0.0), Vector3(3.05, 0.88, 1.28))
	var serving := ServingStationInteractable.new()
	serving.name = "DiningTableServingInteraction"
	serving.object_id = "dining_table_serving"
	serving.position = center + Vector3(0.0, 1.05, 0.0)
	serving.add_child(_area_shape(Vector3(3.25, 0.80, 1.48)))
	root.add_child(serving)

	_add_dining_chair(root, Vector3(5.25, 0.0, -0.16), 0.0, "dining_north_west")
	_add_dining_chair(root, Vector3(7.05, 0.0, -0.16), 0.0, "dining_north_east")
	_add_dining_chair(root, Vector3(5.25, 0.0, -2.14), 180.0, "dining_south_west")
	_add_dining_chair(root, Vector3(7.05, 0.0, -2.14), 180.0, "dining_south_east")
	_add_dining_chair(root, Vector3(4.42, 0.0, -1.15), -90.0, "dining_west")
	_add_dining_chair(root, Vector3(7.88, 0.0, -1.15), 90.0, "dining_east")

	# A pair of pendants keeps the dining zone distinct from the adjacent bar.
	living_detail_lights.append(_add_pendant(root, Vector3(5.35, 3.10, -1.15)))
	living_detail_lights.append(_add_pendant(root, Vector3(6.95, 3.10, -1.15)))
	_cylinder(root, "DiningCenterpiece", center + Vector3(0.0, 0.91, 0.0), 0.19, 0.24, 0.18, ceramic)
	_sphere(root, "DiningStem", center + Vector3(0.0, 1.14, 0.0), Vector3(0.035, 0.28, 0.035), leaf_dark)
	_sphere(root, "DiningLeaf", center + Vector3(-0.12, 1.31, 0.0), Vector3(0.18, 0.07, 0.10), leaf_light)
	_sphere(root, "DiningLeaf", center + Vector3(0.13, 1.40, 0.02), Vector3(0.16, 0.06, 0.09), leaf_dark)


func _add_dining_chair(parent: Node3D, origin: Vector3, rotation_y: float, seat_id: String) -> void:
	var chair := Node3D.new()
	chair.name = "DiningChair"
	chair.position = origin
	chair.rotation_degrees.y = rotation_y
	parent.add_child(chair)
	_cylinder(chair, "ChairBase", Vector3(0.0, 0.20, 0.0), 0.26, 0.31, 0.07, champagne)
	_cylinder(chair, "ChairStem", Vector3(0.0, 0.39, 0.0), 0.045, 0.055, 0.36, champagne)
	_cylinder(chair, "ChairSeat", Vector3(0.0, 0.59, 0.0), 0.35, 0.35, 0.12, cream, Vector3(1.0, 1.0, 0.88))
	_box(chair, "ChairBack", Vector3(0.0, 0.94, 0.28), Vector3(0.68, 0.58, 0.12), cream)
	_add_collision_box(chair, "DiningChairCollision", Vector3(0.0, 0.48, 0.08), Vector3(0.72, 0.96, 0.64))
	_add_seat_interaction(chair, seat_id, "dining chair", Vector3(0.0, 0.02, -0.03), 0.0, Vector3(0.80, 1.25, 0.82))


func _add_seat_interaction(parent: Node3D, seat_id: String, display_name: String, anchor_position: Vector3, rotation_y: float, area_size: Vector3) -> void:
	var anchor := Node3D.new()
	anchor.name = "%sAnchor" % seat_id.to_pascal_case()
	anchor.position = anchor_position
	anchor.rotation_degrees.y = rotation_y
	parent.add_child(anchor)
	var seat := SeatInteractable.new()
	seat.name = seat_id.to_pascal_case()
	seat.object_id = seat_id
	seat.display_name = display_name
	seat.seat_anchor = anchor
	seat.position = anchor_position + Vector3(0.0, 0.63, 0.0)
	seat.add_child(_area_shape(area_size))
	parent.add_child(seat)


func _area_shape(size: Vector3) -> CollisionShape3D:
	var node := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	node.shape = shape
	return node


func _build_kitchen_details() -> void:
	var root := Node3D.new()
	root.name = "KitchenDetailLayer"
	add_child(root)

	# Three low pendant pools turn the long bar into the social heart of the home.
	for x in [-1.55, 0.25, 2.05]:
		kitchen_detail_lights.append(_add_pendant(root, Vector3(x, 3.10, -6.0)))

	# A compact still life adds scale while keeping the working surface clear.
	_cylinder(root, "BarServingTray", Vector3(1.62, 1.115, -6.02), 0.30, 0.32, 0.035, champagne, Vector3(1.48, 1.0, 0.72))
	_sphere(root, "BarFruit", Vector3(1.47, 1.21, -6.02), Vector3(0.095, 0.095, 0.095), ceramic)
	_sphere(root, "BarFruit", Vector3(1.67, 1.20, -5.97), Vector3(0.085, 0.085, 0.085), leaf_light)
	_sphere(root, "BarFruit", Vector3(1.82, 1.19, -6.05), Vector3(0.075, 0.075, 0.075), walnut)

	# A small herb planter softens the full-height cabinetry beside the sink.
	_add_plant(root, Vector3(-3.55, 0.98, -12.48), 0.34)


func _build_bathroom_details() -> void:
	var root := Node3D.new()
	root.name = "BathroomDetailLayer"
	add_child(root)

	# A quiet spa layer complements the authored bathroom suite without hiding it.
	_box(root, "BathroomRunner", Vector3(-11.45, 0.018, 12.32), Vector3(3.85, 0.028, 1.05), cream)
	_cylinder(root, "SpaStoolTop", Vector3(-13.45, 0.53, 12.12), 0.38, 0.38, 0.12, pale_stone())
	_cylinder(root, "SpaStoolPedestal", Vector3(-13.45, 0.27, 12.12), 0.18, 0.28, 0.48, champagne)
	_add_collision_box(root, "SpaStoolCollision", Vector3(-13.45, 0.35, 12.12), Vector3(0.76, 0.70, 0.76))
	var stool_anchor := Vector3(-13.45, 0.02, 12.12)
	var stool_area := Vector3(0.88, 1.15, 0.88)
	_add_seat_interaction(
		root,
		"bathroom_spa_stool_seat",
		"spa stool",
		stool_anchor,
		90.0,
		stool_area
	)
	_box(root, "FoldedTowelLower", Vector3(-13.45, 0.64, 12.12), Vector3(0.52, 0.08, 0.36), cream)
	_box(root, "FoldedTowelUpper", Vector3(-13.43, 0.73, 12.10), Vector3(0.44, 0.07, 0.31), textile)
	_add_plant(root, Vector3(-15.55, 0.0, 12.55), 0.72)

	# A warm wash over the vanity balances the cooler translucent glazing.
	bathroom_detail_lights.append(_add_warm_spot(root, Vector3(-11.45, 3.02, 11.10), Vector3(-11.45, 1.05, 10.35), 1.25, 4.4))


func _build_living_details() -> void:
	var root := Node3D.new()
	root.name = "LivingRoomLayer"
	add_child(root)
	_box(root, "LivingRug", Vector3(0.15, 0.018, 4.15), Vector3(6.65, 0.025, 4.4), cream)
	# The sculptural oval table and soft planting break up the room's box-heavy silhouette.
	_cylinder(root, "LowCoffeeTable", Vector3(0.25, 0.35, 6.15), 0.95, 0.95, 0.16, pale_stone(), Vector3(1.22, 1.0, 0.58))
	_cylinder(root, "CoffeeTablePedestal", Vector3(0.25, 0.18, 6.15), 0.32, 0.46, 0.34, champagne, Vector3(1.15, 1.0, 0.82))
	_add_collision_box(root, "CoffeeTableCollision", Vector3(0.25, 0.35, 6.15), Vector3(2.35, 0.70, 1.15))
	_cylinder(root, "CeramicTray", Vector3(0.05, 0.455, 6.1), 0.28, 0.30, 0.045, ceramic, Vector3(1.35, 1.0, 0.72))
	_sphere(root, "DecorativeStone", Vector3(0.02, 0.54, 6.08), Vector3(0.12, 0.08, 0.10), charcoal)
	_add_plant(root, Vector3(3.35, 0.0, 5.9), 1.05)
	living_detail_lights.append(_add_floor_lamp(root, Vector3(-3.4, 0.0, 5.4)))


func _build_private_light_switches() -> void:
	_add_decor_switch("suite_detail_lights", Vector3(-5.13, 1.18, 4.90), Vector3(0.035, 0.24, 0.16), Vector3(0.45, 0.75, 0.65), suite_detail_lights)
	_add_decor_switch("bathroom_detail_lights", Vector3(-10.85, 1.18, 8.13), Vector3(0.16, 0.24, 0.035), Vector3(0.65, 0.75, 0.45), bathroom_detail_lights)


func _add_decor_switch(id: String, position: Vector3, plate_size: Vector3, area_size: Vector3, lights: Array[Light3D]) -> void:
	_box(self, "%sPlate" % id, position, plate_size, ceramic)
	var interaction := LightSwitchInteractable.new()
	interaction.name = "%sSwitch" % id
	interaction.object_id = id
	interaction.target_lights = lights
	interaction.position = position
	interaction.add_child(_area_shape(area_size))
	add_child(interaction)


func _link_shared_zone_lights() -> void:
	_register_zone_lights("living_lights", living_detail_lights)
	_register_zone_lights("kitchen_lights", kitchen_detail_lights)
	_register_zone_lights("study_lights", study_detail_lights)


func _register_zone_lights(switch_id: String, lights: Array[Light3D]) -> void:
	var interaction := get_node_or_null("../Apartment/%sSwitch" % switch_id) as LightSwitchInteractable
	if not interaction:
		push_warning("Decor could not find light switch: %s" % switch_id)
		return
	for light in lights:
		interaction.register_light(light)


func _add_plant(parent: Node3D, origin: Vector3, scale_factor := 1.0) -> void:
	_cylinder(parent, "Planter", origin + Vector3(0.0, 0.30, 0.0) * scale_factor, 0.30 * scale_factor, 0.24 * scale_factor, 0.60 * scale_factor, ceramic)
	_cylinder(parent, "PlantStem", origin + Vector3(0.0, 0.94, 0.0) * scale_factor, 0.025 * scale_factor, 0.035 * scale_factor, 0.82 * scale_factor, leaf_dark)
	var leaves := [
		[Vector3(-0.22, 1.03, 0.02), Vector3(0.34, 0.12, 0.18), Vector3(0, 0, -24)],
		[Vector3(0.20, 1.20, -0.06), Vector3(0.30, 0.11, 0.17), Vector3(0, 0, 28)],
		[Vector3(-0.12, 1.39, 0.08), Vector3(0.28, 0.10, 0.16), Vector3(8, 0, -18)],
		[Vector3(0.14, 1.54, 0.02), Vector3(0.25, 0.09, 0.14), Vector3(-6, 0, 24)],
		[Vector3(0.02, 1.70, -0.04), Vector3(0.20, 0.08, 0.12), Vector3(0, 0, 4)]
	]
	for index in range(leaves.size()):
		var data: Array = leaves[index]
		var leaf := _sphere(parent, "PlantLeaf", origin + data[0] * scale_factor, data[1] * scale_factor, leaf_dark if index % 2 == 0 else leaf_light)
		leaf.rotation_degrees = data[2]


func _add_pendant(parent: Node3D, ceiling_origin: Vector3) -> OmniLight3D:
	_box(parent, "PendantCord", ceiling_origin + Vector3(0.0, -0.42, 0.0), Vector3(0.025, 0.84, 0.025), charcoal)
	_cylinder(parent, "PendantCanopy", ceiling_origin + Vector3(0.0, -0.02, 0.0), 0.13, 0.13, 0.045, champagne)
	_cylinder(parent, "PendantShade", ceiling_origin + Vector3(0.0, -0.90, 0.0), 0.16, 0.31, 0.28, charcoal)
	var light := OmniLight3D.new()
	light.name = "PendantGlow"
	light.position = ceiling_origin + Vector3(0.0, -1.08, 0.0)
	light.light_color = Color("ffd4a0")
	light.light_energy = 0.58
	light.omni_range = 3.2
	light.shadow_enabled = true
	parent.add_child(light)
	return light


func _add_table_lamp(parent: Node3D, origin: Vector3, scale_factor := 1.0) -> OmniLight3D:
	_box(parent, "LampStem", origin + Vector3(0.0, 0.22 * scale_factor, 0.0), Vector3(0.045, 0.44, 0.045) * scale_factor, champagne)
	var shade := MeshInstance3D.new()
	shade.name = "LampShade"
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.13 * scale_factor
	mesh.bottom_radius = 0.22 * scale_factor
	mesh.height = 0.28 * scale_factor
	mesh.radial_segments = 36
	mesh.material = cream
	shade.mesh = mesh
	shade.position = origin + Vector3(0.0, 0.52 * scale_factor, 0.0)
	parent.add_child(shade)
	var light := OmniLight3D.new()
	light.name = "TableLampGlow"
	light.position = origin + Vector3(0.0, 0.49 * scale_factor, 0.0)
	light.light_color = Color("ffd4a0")
	light.light_energy = 0.72
	light.omni_range = 2.7
	light.shadow_enabled = true
	parent.add_child(light)
	return light


func _add_floor_lamp(parent: Node3D, origin: Vector3) -> OmniLight3D:
	_box(parent, "FloorLampStem", origin + Vector3(0.0, 0.82, 0.0), Vector3(0.055, 1.64, 0.055), champagne)
	var shade := MeshInstance3D.new()
	shade.name = "FloorLampShade"
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.22
	mesh.bottom_radius = 0.36
	mesh.height = 0.42
	mesh.radial_segments = 40
	mesh.material = cream
	shade.mesh = mesh
	shade.position = origin + Vector3(0.0, 1.65, 0.0)
	parent.add_child(shade)
	var light := OmniLight3D.new()
	light.position = origin + Vector3(0.0, 1.55, 0.0)
	light.light_color = Color("ffd4a0")
	light.light_energy = 1.05
	light.omni_range = 4.2
	light.shadow_enabled = true
	parent.add_child(light)
	return light


func _add_warm_spot(parent: Node3D, from: Vector3, target: Vector3, energy: float, light_range: float) -> SpotLight3D:
	var light := SpotLight3D.new()
	light.position = from
	light.light_color = Color("ffd5a2")
	light.light_energy = energy
	light.spot_range = light_range
	light.spot_angle = 42.0
	light.shadow_enabled = true
	light.look_at_from_position(from, target, Vector3.UP)
	parent.add_child(light)
	return light


func _cylinder(parent: Node3D, node_name: String, position: Vector3, top_radius: float, bottom_radius: float, height: float, material: Material, shape_scale := Vector3.ONE) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = node_name
	var mesh := CylinderMesh.new()
	mesh.top_radius = top_radius
	mesh.bottom_radius = bottom_radius
	mesh.height = height
	mesh.radial_segments = 48
	mesh.material = material
	node.mesh = mesh
	node.position = position
	node.scale = shape_scale
	parent.add_child(node)
	return node


func _sphere(parent: Node3D, node_name: String, position: Vector3, shape_scale: Vector3, material: Material) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = node_name
	var mesh := SphereMesh.new()
	mesh.radius = 1.0
	mesh.height = 2.0
	mesh.radial_segments = 32
	mesh.rings = 16
	mesh.material = material
	node.mesh = mesh
	node.position = position
	node.scale = shape_scale
	parent.add_child(node)
	return node


func _add_collision_box(parent: Node3D, node_name: String, position: Vector3, size: Vector3) -> void:
	var body := StaticBody3D.new()
	body.name = node_name
	body.position = position
	var shape_node := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	shape_node.shape = shape
	body.add_child(shape_node)
	parent.add_child(body)


func _box(parent: Node3D, node_name: String, position: Vector3, size: Vector3, material: Material) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = node_name
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh.material = material
	node.mesh = mesh
	node.position = position
	parent.add_child(node)
	return node


func pale_stone() -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("cfc5b6")
	mat.roughness = 0.34
	return mat
