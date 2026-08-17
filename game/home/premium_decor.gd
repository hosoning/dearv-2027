class_name PremiumDecor
extends Node3D

var cream := StandardMaterial3D.new()
var walnut := StandardMaterial3D.new()
var champagne := StandardMaterial3D.new()
var textile := StandardMaterial3D.new()
var charcoal := StandardMaterial3D.new()
var mirror := StandardMaterial3D.new()
var warm_glow := StandardMaterial3D.new()


func _ready() -> void:
	_setup_materials()
	_build_master_bedroom()
	_build_walk_in_wardrobe()
	_build_study()
	_build_living_details()


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


func _build_master_bedroom() -> void:
	var root := Node3D.new()
	root.name = "MasterBedroomLayer"
	add_child(root)

	# Oversized textile rug anchors the bed instead of leaving it floating on the timber floor.
	_box(root, "BedroomRug", Vector3(-11.45, 0.018, -6.75), Vector3(5.6, 0.028, 4.5), textile)
	_box(root, "HeadboardWallPanel", Vector3(-11.45, 1.72, -8.73), Vector3(6.4, 2.75, 0.08), walnut)
	for x in [-13.62, -9.28]:
		_box(root, "BedsideCabinet", Vector3(x, 0.36, -7.85), Vector3(0.82, 0.72, 0.58), walnut)
		_box(root, "BedsideTop", Vector3(x, 0.74, -7.85), Vector3(0.88, 0.045, 0.62), champagne)
		_add_table_lamp(root, Vector3(x, 0.78, -7.85))

	# A restrained upholstered bench makes the foot of the bed read as a real hotel-like suite.
	_box(root, "BedroomBenchSeat", Vector3(-11.45, 0.45, -5.34), Vector3(2.15, 0.34, 0.62), cream)
	for x in [-12.28, -10.62]:
		_box(root, "BedroomBenchLeg", Vector3(x, 0.22, -5.34), Vector3(0.08, 0.44, 0.46), champagne)

	# Art is intentionally abstract/system-authored; it does not invent personal copy.
	_box(root, "BedroomArtFrame", Vector3(-14.55, 1.72, -8.64), Vector3(1.0, 1.28, 0.055), champagne)
	_box(root, "BedroomArtCanvas", Vector3(-14.55, 1.72, -8.59), Vector3(0.86, 1.14, 0.03), cream)

	_add_warm_spot(root, Vector3(-11.45, 2.95, -6.2), Vector3(-11.45, 0.8, -7.2), 1.55, 5.5)


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

	# Small dressing stool rather than another large block.
	_box(root, "DressingStoolSeat", Vector3(-11.45, 0.48, 5.15), Vector3(0.92, 0.22, 0.58), cream)
	for x in [-11.78, -11.12]:
		_box(root, "DressingStoolLeg", Vector3(x, 0.24, 5.15), Vector3(0.055, 0.48, 0.42), champagne)

	_add_warm_spot(root, Vector3(-11.45, 3.02, 3.72), Vector3(-11.45, 0.75, 3.85), 1.4, 4.8)


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
	_add_table_lamp(root, Vector3(13.05, 0.83, 2.62), 0.82)
	_add_warm_spot(root, Vector3(14.35, 2.98, 3.15), Vector3(14.35, 0.75, 3.0), 1.35, 5.0)


func _build_living_details() -> void:
	var root := Node3D.new()
	root.name = "LivingRoomLayer"
	add_child(root)
	_box(root, "LivingRug", Vector3(0.15, 0.018, 4.15), Vector3(6.65, 0.025, 4.4), cream)
	_box(root, "LowCoffeeTable", Vector3(0.25, 0.34, 6.15), Vector3(2.25, 0.18, 0.92), pale_stone())
	for x in [-0.55, 1.05]:
		_box(root, "CoffeeTableLeg", Vector3(x, 0.17, 6.15), Vector3(0.08, 0.34, 0.64), champagne)
	_add_floor_lamp(root, Vector3(-3.4, 0.0, 5.4))


func _add_table_lamp(parent: Node3D, origin: Vector3, scale_factor := 1.0) -> void:
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


func _add_floor_lamp(parent: Node3D, origin: Vector3) -> void:
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


func _add_warm_spot(parent: Node3D, from: Vector3, target: Vector3, energy: float, light_range: float) -> void:
	var light := SpotLight3D.new()
	light.position = from
	light.light_color = Color("ffd5a2")
	light.light_energy = energy
	light.spot_range = light_range
	light.spot_angle = 42.0
	light.shadow_enabled = true
	light.look_at_from_position(from, target, Vector3.UP)
	parent.add_child(light)


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
