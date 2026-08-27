class_name PremiumDecor
extends Node3D

var cream := ShaderMaterial.new()
var walnut := ShaderMaterial.new()
var champagne := ShaderMaterial.new()
var textile := ShaderMaterial.new()
var charcoal := StandardMaterial3D.new()
var mirror := StandardMaterial3D.new()
var crystal := StandardMaterial3D.new()
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
	var fabric_shader := _create_woven_fabric_shader()
	cream.shader = fabric_shader
	cream.set_shader_parameter("base_color", Color("e7dfd3"))
	cream.set_shader_parameter("fabric_roughness", 0.86)
	textile.shader = fabric_shader
	textile.set_shader_parameter("base_color", Color("776d65"))
	textile.set_shader_parameter("fabric_roughness", 0.94)
	walnut.shader = _create_walnut_shader()
	champagne.shader = _create_brushed_champagne_shader()
	charcoal.albedo_color = Color("24211f")
	charcoal.roughness = 0.62
	mirror.albedo_color = Color(0.58, 0.66, 0.7, 0.42)
	mirror.metallic = 0.86
	mirror.roughness = 0.08
	crystal.albedo_color = Color(0.74, 0.88, 0.92, 0.34)
	crystal.roughness = 0.07
	crystal.metallic = 0.08
	crystal.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
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


func _create_brushed_champagne_shader() -> Shader:
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

varying vec3 world_position;

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float brush_axis = world_position.y * 0.88 + world_position.x * 0.09 + world_position.z * 0.05;
	float fine_brush = sin(brush_axis * 460.0) * 0.5 + 0.5;
	float cross_brush = sin((world_position.x - world_position.z) * 115.0 + world_position.y * 23.0) * 0.5 + 0.5;
	float brush = fine_brush * 0.72 + cross_brush * 0.28;
	vec3 champagne_dark = vec3(0.455, 0.325, 0.195);
	vec3 champagne_light = vec3(0.735, 0.565, 0.350);
	ALBEDO = mix(champagne_dark, champagne_light, 0.44 + brush * 0.40);
	ROUGHNESS = mix(0.21, 0.34, brush);
	METALLIC = 0.82;
	SPECULAR = 0.86;
}
"""
	return shader


func _create_walnut_shader() -> Shader:
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

varying vec3 world_position;

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float grain_axis = world_position.y * 0.80 + world_position.x * 0.16 + world_position.z * 0.08;
	float long_grain = sin(grain_axis * 23.0 + sin(world_position.x * 2.4 + world_position.z * 2.0) * 2.8) * 0.5 + 0.5;
	float fine_grain = sin(grain_axis * 136.0 + sin(world_position.x * 7.2 - world_position.z * 4.6) * 0.82) * 0.5 + 0.5;
	float pore = sin((world_position.x + world_position.z) * 88.0 + world_position.y * 41.0) * 0.5 + 0.5;
	float grain = long_grain * 0.54 + fine_grain * 0.33 + pore * 0.13;
	vec3 smoked_dark = vec3(0.145, 0.072, 0.042);
	vec3 smoked_light = vec3(0.330, 0.195, 0.120);
	ALBEDO = mix(smoked_dark, smoked_light, grain);
	ROUGHNESS = mix(0.40, 0.55, fine_grain * 0.65 + pore * 0.35);
	SPECULAR = 0.32;
}
"""
	return shader


func _create_woven_fabric_shader() -> Shader:
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

uniform vec3 base_color : source_color = vec3(0.75);
uniform float fabric_roughness : hint_range(0.0, 1.0) = 0.9;
varying vec3 world_position;

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float warp = sin((world_position.x + world_position.y * 0.37 + world_position.z * 0.08) * 185.0) * 0.5 + 0.5;
	float weft = sin((world_position.z + world_position.y * 0.61 - world_position.x * 0.06) * 172.0) * 0.5 + 0.5;
	float basket = warp * 0.46 + weft * 0.46 + warp * weft * 0.08;
	float soft_cloud = sin(world_position.x * 3.2 + world_position.z * 2.6 + world_position.y * 1.8) * 0.5 + 0.5;
	ALBEDO = base_color * mix(0.91, 1.065, basket * 0.78 + soft_cloud * 0.22);
	ROUGHNESS = clamp(fabric_roughness + (basket - 0.5) * 0.065, 0.55, 1.0);
	SPECULAR = 0.14;
}
"""
	return shader


func _build_master_bedroom() -> void:
	var root := Node3D.new()
	root.name = "MasterBedroomLayer"
	add_child(root)

	# Oversized textile rug anchors the bed instead of leaving it floating on the timber floor.
	_box(root, "BedroomRug", Vector3(-11.45, 0.018, -6.75), Vector3(5.6, 0.028, 4.5), textile)
	_box(root, "BedroomRugBindingNorth", Vector3(-11.45, 0.038, -4.505), Vector3(5.56, 0.018, 0.035), charcoal)
	_box(root, "BedroomRugBindingSouth", Vector3(-11.45, 0.038, -8.995), Vector3(5.56, 0.018, 0.035), charcoal)
	_box(root, "BedroomRugBindingWest", Vector3(-14.23, 0.038, -6.75), Vector3(0.035, 0.018, 4.48), charcoal)
	_box(root, "BedroomRugBindingEast", Vector3(-8.67, 0.038, -6.75), Vector3(0.035, 0.018, 4.48), charcoal)

	# Tailored upholstered wall panels sit within a walnut surround. Deep seams,
	# perimeter metal trim and varied nap replace the former single slab.
	_box(root, "HeadboardWallPanel", Vector3(-11.45, 1.72, -8.73), Vector3(6.4, 2.75, 0.08), walnut)
	for panel_index in range(5):
		var panel_x := -14.05 + float(panel_index) * 1.30
		_box(root, "UpholsteredWallPanel", Vector3(panel_x, 1.72, -8.675), Vector3(1.16, 2.36, 0.055), textile if panel_index % 2 == 0 else cream)
		if panel_index < 4:
			_box(root, "UpholsteredPanelReveal", Vector3(panel_x + 0.65, 1.72, -8.638), Vector3(0.035, 2.38, 0.025), charcoal)
	_box(root, "HeadboardTrimTop", Vector3(-11.45, 2.96, -8.64), Vector3(6.20, 0.045, 0.035), champagne)
	_box(root, "HeadboardTrimBottom", Vector3(-11.45, 0.48, -8.64), Vector3(6.20, 0.045, 0.035), champagne)
	_box(root, "HeadboardTrimLeft", Vector3(-14.55, 1.72, -8.64), Vector3(0.045, 2.52, 0.035), champagne)
	_box(root, "HeadboardTrimRight", Vector3(-8.35, 1.72, -8.64), Vector3(0.045, 2.52, 0.035), champagne)

	# ApartmentBuilder owns the interactive bedside cabinets. Place the lamps on
	# those exact tops so no duplicate boxes or collision shells overlap them.
	for x in [-13.45, -9.45]:
		suite_detail_lights.append(_add_table_lamp(root, Vector3(x, 0.78, -7.72)))

	# A rounded upholstered bench with a recessed timber plinth and tapered
	# champagne legs replaces the previous rectangular cushion block.
	_sphere(root, "BedroomBenchCushion", Vector3(-11.45, 0.47, -5.34), Vector3(1.08, 0.19, 0.32), cream)
	_sphere(root, "BedroomBenchUnderpad", Vector3(-11.45, 0.34, -5.34), Vector3(1.02, 0.10, 0.28), walnut)
	for x in [-12.25, -10.65]:
		for z in [-5.52, -5.16]:
			_cylinder(root, "BedroomBenchTaperedLeg", Vector3(x, 0.19, z), 0.025, 0.045, 0.34, champagne)
	for x in [-11.85, -11.45, -11.05]:
		_sphere(root, "BedroomBenchTuft", Vector3(x, 0.645, -5.34), Vector3(0.025, 0.012, 0.025), champagne)
	_add_collision_box(root, "BedroomBenchCollision", Vector3(-11.45, 0.38, -5.34), Vector3(2.15, 0.76, 0.62))
	_add_seat_interaction(root, "bedroom_bench_seat", "bedroom bench", Vector3(-11.45, 0.02, -4.98), 0.0, Vector3(2.10, 1.25, 0.86))

	# Art is intentionally abstract/system-authored; it does not invent personal copy.
	_box(root, "BedroomArtFrame", Vector3(-14.55, 1.72, -8.64), Vector3(1.0, 1.28, 0.055), champagne)
	_box(root, "BedroomArtCanvas", Vector3(-14.55, 1.72, -8.59), Vector3(0.86, 1.14, 0.03), cream)

	# A leafy corner and a soft folded throw keep the suite from reading as a showroom.
	_add_plant(root, Vector3(-14.30, 0.0, -5.35), 0.84)
	_sphere(root, "BenchThrowFold", Vector3(-11.78, 0.64, -5.34), Vector3(0.39, 0.035, 0.29), textile)
	for z in [-5.56, -5.46, -5.36, -5.26, -5.16]:
		_box(root, "BenchThrowFringe", Vector3(-12.17, 0.615, z), Vector3(0.12, 0.012, 0.012), textile)
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

	# Fine jewellery and a watch occupy the dressing top at human scale.
	_box(root, "WatchStrap", Vector3(-11.18, 1.088, 3.82), Vector3(0.10, 0.016, 0.42), charcoal)
	_cylinder(root, "WatchCase", Vector3(-11.18, 1.112, 3.82), 0.085, 0.085, 0.025, champagne)
	_cylinder(root, "WatchDial", Vector3(-11.18, 1.130, 3.82), 0.068, 0.068, 0.010, mirror)
	for index in range(11):
		var chain_x := -10.88 + float(index) * 0.055
		var chain_z := 3.70 + sin(float(index) * 0.55) * 0.09
		_sphere(root, "NecklaceLink", Vector3(chain_x, 1.105, chain_z), Vector3(0.018, 0.010, 0.018), champagne)
	_sphere(root, "NecklacePendant", Vector3(-10.61, 1.118, 3.61), Vector3(0.045, 0.018, 0.06), champagne)
	for x in [-11.96, -11.82]:
		_sphere(root, "StudEarring", Vector3(x, 1.112, 3.94), Vector3(0.035, 0.018, 0.035), champagne)
		_sphere(root, "EarringStone", Vector3(x, 1.128, 3.94), Vector3(0.018, 0.012, 0.018), crystal)

	# The dressing stool now has an oval upholstered crown, timber shadow collar
	# and four tapered legs instead of a padded rectangular block.
	_sphere(root, "DressingStoolCushion", Vector3(-11.45, 0.50, 5.15), Vector3(0.47, 0.14, 0.30), cream)
	_sphere(root, "DressingStoolUnderpad", Vector3(-11.45, 0.40, 5.15), Vector3(0.43, 0.075, 0.26), walnut)
	for x in [-11.76, -11.14]:
		for z in [4.98, 5.32]:
			_cylinder(root, "DressingStoolTaperedLeg", Vector3(x, 0.22, z), 0.020, 0.038, 0.40, champagne)
	_add_collision_box(root, "DressingStoolCollision", Vector3(-11.45, 0.38, 5.15), Vector3(0.92, 0.76, 0.58))
	_add_seat_interaction(root, "dressing_stool_seat", "dressing stool", Vector3(-11.45, 0.02, 5.15), 0.0, Vector3(0.98, 1.15, 0.76))

	suite_detail_lights.append(_add_warm_spot(root, Vector3(-11.45, 3.02, 3.72), Vector3(-11.45, 0.75, 3.85), 1.4, 4.8))


func _build_study() -> void:
	var root := Node3D.new()
	root.name = "ExecutiveStudyLayer"
	add_child(root)

	_box(root, "StudyRug", Vector3(14.25, 0.018, 3.25), Vector3(5.35, 0.028, 4.25), charcoal)

	# Tall walnut library wall, assembled as recessed joinery: back panels,
	# structural stiles, shelf nosing, under-shelf light and closed base storage.
	for z in [-2.5, 0.3, 6.0, 8.8]:
		_box(root, "LibraryBay", Vector3(17.55, 1.42, z), Vector3(0.58, 2.84, 2.28), walnut)
		_box(root, "LibraryRecessBack", Vector3(17.235, 1.62, z), Vector3(0.045, 2.34, 2.00), charcoal)
		for side in [-1.0, 1.0]:
			_box(root, "LibraryStile", Vector3(17.15, 1.54, z + side * 1.045), Vector3(0.14, 2.65, 0.09), walnut)
		for y in [0.58, 1.18, 1.78, 2.38]:
			_box(root, "LibraryShelf", Vector3(17.15, y, z), Vector3(0.17, 0.065, 2.04), walnut)
			_box(root, "LibraryShelfNosing", Vector3(17.055, y, z), Vector3(0.035, 0.095, 2.06), champagne)
			if y > 0.60:
				_box(root, "LibraryShelfGlow", Vector3(17.035, y - 0.075, z), Vector3(0.025, 0.025, 1.88), warm_glow)
		_box(root, "LibraryToeKick", Vector3(17.16, 0.085, z), Vector3(0.15, 0.15, 1.92), charcoal)
		for door_z in [-0.49, 0.49]:
			_box(root, "LibraryLowerDoor", Vector3(17.075, 0.34, z + door_z), Vector3(0.055, 0.46, 0.91), walnut)
			_box(root, "LibraryLowerReveal", Vector3(17.042, 0.34, z + door_z), Vector3(0.018, 0.40, 0.018), charcoal)
			_box(root, "LibraryLowerPull", Vector3(17.028, 0.43, z + door_z * 0.22), Vector3(0.025, 0.025, 0.24), champagne)
		_box(root, "LibraryCrown", Vector3(17.14, 2.87, z), Vector3(0.16, 0.11, 2.12), walnut)

	# Tailored library styling: varied book heights, subtle lean, raised cover
	# lips and spine bands replace the sparse row of identical cuboids.
	var book_colors := [Color("7e6655"), Color("c2b09a"), Color("36312d"), Color("9a7a5d"), Color("52616a")]
	var page_material := StandardMaterial3D.new()
	page_material.albedo_color = Color("d8cdbb")
	page_material.roughness = 0.92
	var label_material := StandardMaterial3D.new()
	label_material.albedo_color = Color("b7935f")
	label_material.roughness = 0.30
	label_material.metallic = 0.62
	var book_clusters := [
		[-3.48, 0.58, 7],
		[-2.28, 1.18, 6],
		[-3.26, 1.78, 5],
		[5.20, 0.58, 7],
		[5.38, 1.78, 6],
		[6.08, 2.38, 5]
	]
	var book_index := 0
	for cluster_data in book_clusters:
		var start_z: float = cluster_data[0]
		var shelf_y: float = cluster_data[1]
		var count: int = cluster_data[2]
		var cursor_z := start_z
		for local_index in range(count):
			var book_height := 0.36 + float((book_index * 3) % 5) * 0.035
			var book_width := 0.13 + float((book_index * 7) % 4) * 0.018
			var cover_material := StandardMaterial3D.new()
			cover_material.albedo_color = book_colors[book_index % book_colors.size()]
			cover_material.roughness = 0.78
			var book := Node3D.new()
			book.name = "TailoredLibraryBook"
			book.position = Vector3(17.00, shelf_y + book_height * 0.5 + 0.055, cursor_z)
			book.rotation_degrees.x = -7.0 + float((book_index * 5) % 15)
			root.add_child(book)
			_box(book, "BookCoverBlock", Vector3.ZERO, Vector3(0.17, book_height, book_width), cover_material)
			_box(book, "BookPageForeEdge", Vector3(-0.091, 0.0, 0.0), Vector3(0.018, book_height - 0.055, book_width - 0.025), page_material)
			for lip_y in [-1.0, 1.0]:
				_box(book, "BookCoverLip", Vector3(-0.010, lip_y * book_height * 0.49, 0.0), Vector3(0.19, 0.018, book_width + 0.025), cover_material)
			for band_y in [-0.28, 0.22]:
				_box(book, "BookSpineBand", Vector3(-0.101, band_y * book_height, 0.0), Vector3(0.014, 0.022, book_width * 0.78), label_material)
			if book_index % 3 == 0:
				_box(book, "BookSpineLabel", Vector3(-0.104, 0.0, 0.0), Vector3(0.012, 0.075, book_width * 0.62), label_material)
			cursor_z += book_width + 0.035
			book_index += 1

	# Horizontal folio stacks fill the wider shelves with page blocks and
	# raised covers, while sculptural bookends prevent every bay repeating.
	for stack_data in [
		Vector3(-2.45, 2.405, -2.55),
		Vector3(5.55, 1.205, 6.45),
		Vector3(6.05, 2.405, 5.35)
	]:
		for layer in range(3):
			var folio_material := StandardMaterial3D.new()
			folio_material.albedo_color = book_colors[(layer + int(abs(stack_data.z))) % book_colors.size()]
			folio_material.roughness = 0.80
			var layer_y := stack_data.y + float(layer) * 0.075
			_box(root, "HorizontalFolioCover", Vector3(17.00, layer_y, stack_data.z), Vector3(0.18, 0.065, 0.62 - float(layer) * 0.035), folio_material)
			_box(root, "HorizontalFolioPages", Vector3(16.90, layer_y, stack_data.z), Vector3(0.025, 0.038, 0.56 - float(layer) * 0.035), page_material)
			_box(root, "HorizontalFolioLabel", Vector3(16.882, layer_y, stack_data.z), Vector3(0.012, 0.022, 0.17), label_material)

	_cylinder(root, "LibrarySculpturePlinth", Vector3(17.00, 1.245, -1.73), 0.15, 0.19, 0.09, champagne)
	_sphere(root, "LibrarySculptureBody", Vector3(17.00, 1.52, -1.73), Vector3(0.16, 0.25, 0.13), ceramic)
	_sphere(root, "LibrarySculptureCutout", Vector3(16.90, 1.57, -1.73), Vector3(0.055, 0.11, 0.055), charcoal)

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

	# Sculpted entry perch: an elliptical cushion, timber shadow base and four
	# tapered legs give the arrival sequence a furniture-grade silhouette.
	_sphere(root, "EntryBenchCushion", Vector3(14.55, 0.50, -8.88), Vector3(1.13, 0.16, 0.29), cream)
	_sphere(root, "EntryBenchUnderpad", Vector3(14.55, 0.38, -8.88), Vector3(1.06, 0.085, 0.25), walnut)
	for x in [13.75, 15.35]:
		for z in [-9.03, -8.73]:
			_cylinder(root, "EntryBenchTaperedLeg", Vector3(x, 0.21, z), 0.022, 0.042, 0.38, champagne)
	for x in [14.12, 14.55, 14.98]:
		_sphere(root, "EntryBenchTuft", Vector3(x, 0.642, -8.88), Vector3(0.022, 0.010, 0.022), champagne)
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
	# Six complete place settings make the table read as a prepared dining scene,
	# with layered ceramic, folded linen, metal cutlery and stemmed glassware.
	_add_place_setting(root, Vector3(5.25, 0.855, -0.60), 180.0)
	_add_place_setting(root, Vector3(7.05, 0.855, -0.60), 180.0)
	_add_place_setting(root, Vector3(5.25, 0.855, -1.70), 0.0)
	_add_place_setting(root, Vector3(7.05, 0.855, -1.70), 0.0)
	_add_place_setting(root, Vector3(4.88, 0.855, -1.15), 90.0)
	_add_place_setting(root, Vector3(7.42, 0.855, -1.15), -90.0)
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
	# A transparent layered vase and individually modeled bouquet replace the
	# former pot-and-two-leaves placeholder.
	var vase_water := StandardMaterial3D.new()
	vase_water.albedo_color = Color(0.30, 0.58, 0.62, 0.34)
	vase_water.roughness = 0.08
	vase_water.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	var petal_blush := StandardMaterial3D.new()
	petal_blush.albedo_color = Color("d6a5a0")
	petal_blush.roughness = 0.74
	_cylinder(root, "DiningVaseFoot", center + Vector3(0.0, 0.89, 0.0), 0.14, 0.18, 0.07, crystal)
	_cylinder(root, "DiningVaseBowl", center + Vector3(0.0, 1.02, 0.0), 0.11, 0.18, 0.22, crystal)
	_cylinder(root, "DiningVaseNeck", center + Vector3(0.0, 1.17, 0.0), 0.075, 0.11, 0.10, crystal)
	_cylinder(root, "DiningVaseWater", center + Vector3(0.0, 1.00, 0.0), 0.105, 0.15, 0.16, vase_water)
	var vase_rim := MeshInstance3D.new()
	vase_rim.name = "DiningVaseRolledRim"
	var vase_rim_mesh := TorusMesh.new()
	vase_rim_mesh.inner_radius = 0.070
	vase_rim_mesh.outer_radius = 0.083
	vase_rim_mesh.rings = 36
	vase_rim_mesh.ring_segments = 10
	vase_rim_mesh.material = champagne
	vase_rim.mesh = vase_rim_mesh
	vase_rim.position = center + Vector3(0.0, 1.225, 0.0)
	root.add_child(vase_rim)

	var blooms := [
		Vector4(-0.16, -0.04, 1.53, 0.0),
		Vector4(0.14, -0.06, 1.61, 1.0),
		Vector4(-0.05, 0.13, 1.70, 0.0),
		Vector4(0.18, 0.10, 1.48, 1.0),
		Vector4(0.02, -0.15, 1.78, 0.0)
	]
	for bloom_index in range(blooms.size()):
		var bloom: Vector4 = blooms[bloom_index]
		var stem_center := center + Vector3(bloom.x * 0.45, (1.21 + bloom.z) * 0.5, bloom.y * 0.45)
		var stem_height := bloom.z - 1.21
		var stem := _cylinder(root, "DiningFlowerStem", stem_center, 0.012, 0.015, stem_height, leaf_dark)
		stem.rotation_degrees.z = -bloom.x * 28.0
		stem.rotation_degrees.x = bloom.y * 24.0
		var bloom_center := center + Vector3(bloom.x, bloom.z, bloom.y)
		var petal_material: Material = cream if bloom.w < 0.5 else petal_blush
		for petal_index in range(6):
			var petal_angle := float(petal_index) * 60.0
			var petal_radians := deg_to_rad(petal_angle)
			var petal := _sphere(
				root,
				"DiningFlowerPetal",
				bloom_center + Vector3(cos(petal_radians) * 0.065, sin(petal_radians * 2.0) * 0.014, sin(petal_radians) * 0.065),
				Vector3(0.070, 0.026, 0.040),
				petal_material
			)
			petal.rotation_degrees.y = -petal_angle
		_sphere(root, "DiningFlowerCenter", bloom_center + Vector3(0.0, 0.018, 0.0), Vector3(0.034, 0.030, 0.034), champagne)
		if bloom_index < 4:
			var leaf := _sphere(
				root,
				"DiningBouquetLeaf",
				center + Vector3(bloom.x * 0.62, 1.34 + float(bloom_index % 2) * 0.08, bloom.y * 0.62),
				Vector3(0.15, 0.035, 0.065),
				leaf_light if bloom_index % 2 == 0 else leaf_dark
			)
			leaf.rotation_degrees.y = float(bloom_index) * 42.0 - 64.0


func _add_place_setting(parent: Node3D, origin: Vector3, rotation_y: float) -> void:
	var setting := Node3D.new()
	setting.name = "DiningPlaceSetting"
	setting.position = origin
	setting.rotation_degrees.y = rotation_y
	parent.add_child(setting)

	_cylinder(setting, "StoneCharger", Vector3.ZERO, 0.205, 0.205, 0.018, pale_stone())
	_cylinder(setting, "DinnerPlate", Vector3(0.0, 0.018, 0.0), 0.155, 0.175, 0.025, ceramic)
	_cylinder(setting, "ShallowBowl", Vector3(0.0, 0.043, 0.0), 0.105, 0.075, 0.045, ceramic)
	_box(setting, "DinnerKnife", Vector3(0.245, 0.022, 0.0), Vector3(0.018, 0.018, 0.31), champagne)
	_box(setting, "DinnerFork", Vector3(-0.245, 0.022, 0.0), Vector3(0.022, 0.018, 0.29), champagne)
	for tine_x in [-0.014, 0.0, 0.014]:
		_box(setting, "ForkTine", Vector3(-0.245 + tine_x, 0.028, -0.158), Vector3(0.006, 0.012, 0.065), champagne)
	_sphere(setting, "FoldedNapkin", Vector3(0.0, 0.085, 0.0), Vector3(0.16, 0.035, 0.075), cream)
	_cylinder(setting, "WineGlassFoot", Vector3(0.29, 0.018, -0.18), 0.055, 0.055, 0.012, crystal)
	_cylinder(setting, "WineGlassStem", Vector3(0.29, 0.105, -0.18), 0.009, 0.009, 0.17, crystal)
	_sphere(setting, "WineGlassBowl", Vector3(0.29, 0.225, -0.18), Vector3(0.072, 0.10, 0.072), crystal)


func _add_dining_chair(parent: Node3D, origin: Vector3, rotation_y: float, seat_id: String) -> void:
	var chair := Node3D.new()
	chair.name = "SculptedDiningChair"
	chair.position = origin
	chair.rotation_degrees.y = rotation_y
	parent.add_child(chair)

	# A tapered pedestal and thin under-seat collar keep the silhouette light.
	_cylinder(chair, "ChairBase", Vector3(0.0, 0.18, 0.0), 0.23, 0.31, 0.055, champagne)
	_cylinder(chair, "ChairStem", Vector3(0.0, 0.38, 0.0), 0.042, 0.060, 0.36, champagne)
	_cylinder(chair, "ChairSeatCollar", Vector3(0.0, 0.535, 0.0), 0.31, 0.27, 0.055, walnut, Vector3(1.03, 1.0, 0.88))
	_cylinder(chair, "ChairSeat", Vector3(0.0, 0.60, -0.015), 0.35, 0.34, 0.13, cream, Vector3(1.0, 1.0, 0.88))
	_sphere(chair, "SeatFrontCrown", Vector3(0.0, 0.655, -0.16), Vector3(0.32, 0.075, 0.18), cream)

	# The back is built from an embracing shell plus overlapping upholstered
	# lobes, producing a rounded tub profile instead of a rectangular slab.
	_sphere(chair, "CurvedBackShell", Vector3(0.0, 0.93, 0.31), Vector3(0.38, 0.34, 0.10), walnut)
	_sphere(chair, "BackCenterCushion", Vector3(0.0, 0.95, 0.255), Vector3(0.30, 0.285, 0.105), cream)
	_sphere(chair, "BackLeftWing", Vector3(-0.27, 0.89, 0.20), Vector3(0.15, 0.25, 0.12), cream)
	_sphere(chair, "BackRightWing", Vector3(0.27, 0.89, 0.20), Vector3(0.15, 0.25, 0.12), cream)
	_cylinder(chair, "LeftBackPiping", Vector3(-0.31, 0.94, 0.245), 0.012, 0.012, 0.43, champagne)
	_cylinder(chair, "RightBackPiping", Vector3(0.31, 0.94, 0.245), 0.012, 0.012, 0.43, champagne)
	_cylinder(chair, "LeftBackSupport", Vector3(-0.23, 0.72, 0.25), 0.018, 0.022, 0.28, champagne)
	_cylinder(chair, "RightBackSupport", Vector3(0.23, 0.72, 0.25), 0.018, 0.022, 0.28, champagne)

	_add_collision_box(chair, "DiningChairCollision", Vector3(0.0, 0.50, 0.08), Vector3(0.76, 1.0, 0.68))
	_add_seat_interaction(chair, seat_id, "dining chair", Vector3(0.0, 0.02, -0.03), 0.0, Vector3(0.84, 1.28, 0.86))


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

	# A sculpted kettle and breakfast toaster give the long worktop real close-range
	# appliance detail. Curved shells, separate hardware and visible contents
	# avoid the former empty-counter / rectangular-prop look.
	_cylinder(root, "KettleWeightedBase", Vector3(-4.96, 1.015, -8.68), 0.205, 0.225, 0.045, charcoal)
	_sphere(root, "KettleRoundedBody", Vector3(-4.96, 1.245, -8.68), Vector3(0.235, 0.265, 0.215), champagne)
	_sphere(root, "KettleShoulder", Vector3(-4.96, 1.415, -8.68), Vector3(0.175, 0.115, 0.175), champagne)
	_cylinder(root, "KettleLid", Vector3(-4.96, 1.515, -8.68), 0.105, 0.135, 0.040, charcoal)
	_sphere(root, "KettleLidKnob", Vector3(-4.96, 1.560, -8.68), Vector3(0.045, 0.040, 0.045), champagne)
	var kettle_spout := _cylinder(root, "KettleTaperedSpout", Vector3(-4.70, 1.355, -8.68), 0.055, 0.115, 0.36, champagne)
	kettle_spout.rotation_degrees.z = -58.0
	_cylinder(root, "KettleSpoutRim", Vector3(-4.52, 1.465, -8.68), 0.058, 0.072, 0.035, charcoal).rotation_degrees.z = -58.0
	var kettle_handle := MeshInstance3D.new()
	kettle_handle.name = "KettleArchedHandle"
	var kettle_handle_mesh := TorusMesh.new()
	kettle_handle_mesh.inner_radius = 0.175
	kettle_handle_mesh.outer_radius = 0.205
	kettle_handle_mesh.rings = 40
	kettle_handle_mesh.ring_segments = 10
	kettle_handle_mesh.material = charcoal
	kettle_handle.mesh = kettle_handle_mesh
	kettle_handle.position = Vector3(-5.12, 1.38, -8.68)
	kettle_handle.rotation_degrees.x = 90.0
	kettle_handle.scale = Vector3(0.72, 1.10, 1.0)
	root.add_child(kettle_handle)
	_box(root, "KettleWaterGauge", Vector3(-4.735, 1.255, -8.68), Vector3(0.018, 0.22, 0.055), crystal)
	_sphere(root, "KettlePowerGlow", Vector3(-4.74, 1.075, -8.68), Vector3(0.018, 0.018, 0.018), warm_glow)

	# The toaster uses a pillowed metal body, inset browning slots, lever and two
	# irregular bread crowns so it reads as a used appliance rather than a box.
	_sphere(root, "ToasterSoftBody", Vector3(-3.72, 1.145, -12.68), Vector3(0.38, 0.16, 0.255), champagne)
	_sphere(root, "ToasterTopCrown", Vector3(-3.72, 1.255, -12.68), Vector3(0.36, 0.075, 0.235), champagne)
	for slot_x in [-3.84, -3.60]:
		_box(root, "ToasterSlot", Vector3(slot_x, 1.315, -12.68), Vector3(0.115, 0.018, 0.31), charcoal)
		sphere_toast(root, slot_x, -12.68)
	_box(root, "ToasterLeverStem", Vector3(-3.30, 1.20, -12.68), Vector3(0.035, 0.19, 0.035), charcoal)
	_sphere(root, "ToasterLeverGrip", Vector3(-3.30, 1.105, -12.68), Vector3(0.055, 0.035, 0.055), walnut)
	_sphere(root, "ToasterIndicator", Vector3(-3.35, 1.15, -12.42), Vector3(0.020, 0.020, 0.015), warm_glow)

	# A small herb planter softens the full-height cabinetry beside the sink.
	_add_plant(root, Vector3(-3.55, 0.98, -12.48), 0.34)


func sphere_toast(parent: Node3D, x: float, z: float) -> void:
	var toast_crust := StandardMaterial3D.new()
	toast_crust.albedo_color = Color("9a6844")
	toast_crust.roughness = 0.92
	var toast_crumb := StandardMaterial3D.new()
	toast_crumb.albedo_color = Color("d5b786")
	toast_crumb.roughness = 0.96
	_sphere(parent, "ToastSliceCrust", Vector3(x, 1.415, z), Vector3(0.072, 0.115, 0.15), toast_crust)
	_sphere(parent, "ToastSliceCrumb", Vector3(x, 1.420, z - 0.012), Vector3(0.058, 0.096, 0.132), toast_crumb)
	_sphere(parent, "ToastCrownLeft", Vector3(x - 0.030, 1.505, z), Vector3(0.045, 0.045, 0.14), toast_crust)
	_sphere(parent, "ToastCrownRight", Vector3(x + 0.030, 1.505, z), Vector3(0.045, 0.045, 0.14), toast_crust)


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
	# Rolled, crowned towel forms avoid the rigid stack-of-boxes silhouette.
	_sphere(root, "RolledTowelLower", Vector3(-13.45, 0.65, 12.12), Vector3(0.28, 0.09, 0.18), cream)
	_sphere(root, "RolledTowelUpper", Vector3(-13.43, 0.76, 12.10), Vector3(0.23, 0.075, 0.15), textile)
	for x in [-13.64, -13.45, -13.26]:
		_sphere(root, "TowelSoftFold", Vector3(x, 0.815, 12.10), Vector3(0.075, 0.018, 0.12), cream)
	_add_plant(root, Vector3(-15.55, 0.0, 12.55), 0.72)

	# Linear drain, recessed niche and slim glass channels give the shower a
	# constructed wet-room floor instead of a plain tray.
	_box(root, "ShowerLinearDrain", Vector3(-7.80, 0.185, 11.48), Vector3(1.18, 0.028, 0.13), charcoal)
	for x in [-8.28, -8.04, -7.80, -7.56, -7.32]:
		_box(root, "ShowerDrainSlot", Vector3(x, 0.205, 11.48), Vector3(0.035, 0.012, 0.10), champagne)
	_box(root, "ShowerGlassFloorChannel", Vector3(-7.80, 0.16, 10.16), Vector3(1.78, 0.055, 0.055), champagne)
	_box(root, "ShowerGlassWallChannel", Vector3(-6.91, 1.20, 10.90), Vector3(0.055, 2.38, 1.48), champagne)

	# A dark-backed wall niche with a stone shelf adds real storage depth.
	_box(root, "ShowerNicheBack", Vector3(-5.10, 1.42, 11.18), Vector3(0.035, 0.92, 1.18), charcoal)
	_box(root, "ShowerNicheTop", Vector3(-5.16, 1.90, 11.18), Vector3(0.12, 0.07, 1.30), pale_stone())
	_box(root, "ShowerNicheBottom", Vector3(-5.16, 0.94, 11.18), Vector3(0.12, 0.07, 1.30), pale_stone())
	_box(root, "ShowerNicheLeft", Vector3(-5.16, 1.42, 10.56), Vector3(0.12, 0.92, 0.07), pale_stone())
	_box(root, "ShowerNicheRight", Vector3(-5.16, 1.42, 11.80), Vector3(0.12, 0.92, 0.07), pale_stone())
	_cylinder(root, "ShowerBottle", Vector3(-5.25, 1.09, 10.98), 0.055, 0.065, 0.26, ceramic)
	_cylinder(root, "ShowerBottlePump", Vector3(-5.25, 1.25, 10.98), 0.025, 0.025, 0.06, champagne)

	# A removable timber bath caddy, candle and folded washcloth bring human
	# scale to the smooth freestanding tub.
	_box(root, "BathCaddy", Vector3(-15.17, 0.83, 11.06), Vector3(1.62, 0.055, 0.34), walnut)
	for x in [-15.82, -14.52]:
		_box(root, "BathCaddyEnd", Vector3(x, 0.79, 11.06), Vector3(0.08, 0.12, 0.38), walnut)
	_cylinder(root, "BathCandleCup", Vector3(-15.58, 0.93, 11.06), 0.085, 0.09, 0.16, ceramic)
	_sphere(root, "BathCandleFlame", Vector3(-15.58, 1.04, 11.06), Vector3(0.025, 0.055, 0.025), warm_glow)
	_sphere(root, "BathWashclothFold", Vector3(-14.88, 0.90, 11.06), Vector3(0.20, 0.030, 0.14), cream)
	_sphere(root, "BathWashclothCorner", Vector3(-15.04, 0.925, 10.99), Vector3(0.08, 0.018, 0.07), textile)

	# Twin mirror halos and a wall-mounted towel rail layer warm practical detail
	# over the authored sanitary fittings.
	for mirror_x in [-12.35, -10.55]:
		_box(root, "VanityMirrorHaloTop", Vector3(mirror_x, 2.79, 12.09), Vector3(1.30, 0.035, 0.025), warm_glow)
		_box(root, "VanityMirrorHaloBottom", Vector3(mirror_x, 1.25, 12.09), Vector3(1.30, 0.035, 0.025), warm_glow)
		_box(root, "VanityMirrorHaloLeft", Vector3(mirror_x - 0.66, 2.02, 12.09), Vector3(0.035, 1.55, 0.025), warm_glow)
		_box(root, "VanityMirrorHaloRight", Vector3(mirror_x + 0.66, 2.02, 12.09), Vector3(0.035, 1.55, 0.025), warm_glow)
	_box(root, "TowelRail", Vector3(-15.45, 1.42, 8.14), Vector3(1.08, 0.045, 0.045), champagne)
	for x in [-15.95, -14.95]:
		_box(root, "TowelRailMount", Vector3(x, 1.42, 8.10), Vector3(0.055, 0.12, 0.09), champagne)
	# A crowned hanging towel uses overlapping cloth volumes and an uneven hem,
	# so it sags from the rail instead of reading as a thin wall panel.
	_sphere(root, "HangingBathTowelBody", Vector3(-15.45, 1.05, 8.18), Vector3(0.44, 0.38, 0.035), cream)
	_sphere(root, "HangingTowelLeftHem", Vector3(-15.68, 0.70, 8.18), Vector3(0.22, 0.08, 0.035), cream)
	_sphere(root, "HangingTowelRightHem", Vector3(-15.22, 0.73, 8.18), Vector3(0.22, 0.09, 0.035), cream)
	for x in [-15.68, -15.52, -15.36, -15.20]:
		_box(root, "HangingTowelFold", Vector3(x, 1.03, 8.145), Vector3(0.018, 0.60, 0.014), textile)

	# A hanging spa robe is assembled from crowned cloth volumes instead of a
	# flat rectangle: padded shoulders, separated sleeves, overlapping lapels,
	# pockets, belt and uneven lower folds remain readable from the bathroom door.
	var robe_hook := _cylinder(root, "BathrobeWallHook", Vector3(-13.55, 2.36, 8.10), 0.045, 0.060, 0.16, champagne)
	robe_hook.rotation_degrees.x = 90.0
	_sphere(root, "BathrobeHookCap", Vector3(-13.55, 2.36, 8.02), Vector3(0.065, 0.065, 0.045), champagne)
	_sphere(root, "BathrobeShoulderYoke", Vector3(-13.55, 2.14, 8.16), Vector3(0.50, 0.18, 0.10), cream)
	_sphere(root, "BathrobeTorsoLeft", Vector3(-13.77, 1.59, 8.17), Vector3(0.30, 0.62, 0.10), cream)
	_sphere(root, "BathrobeTorsoRight", Vector3(-13.33, 1.59, 8.17), Vector3(0.30, 0.62, 0.10), cream)
	_sphere(root, "BathrobeSkirtLeft", Vector3(-13.78, 0.94, 8.17), Vector3(0.32, 0.55, 0.11), cream)
	_sphere(root, "BathrobeSkirtRight", Vector3(-13.31, 0.90, 8.17), Vector3(0.33, 0.58, 0.11), cream)
	var robe_left_sleeve := _sphere(root, "BathrobeLeftSleeve", Vector3(-14.03, 1.55, 8.16), Vector3(0.17, 0.57, 0.11), cream)
	robe_left_sleeve.rotation_degrees.z = 10.0
	var robe_right_sleeve := _sphere(root, "BathrobeRightSleeve", Vector3(-13.07, 1.58, 8.16), Vector3(0.17, 0.55, 0.11), cream)
	robe_right_sleeve.rotation_degrees.z = -9.0
	_sphere(root, "BathrobeLeftCuff", Vector3(-14.13, 1.04, 8.15), Vector3(0.18, 0.09, 0.12), textile)
	_sphere(root, "BathrobeRightCuff", Vector3(-12.98, 1.09, 8.15), Vector3(0.18, 0.09, 0.12), textile)
	var left_lapel := _box(root, "BathrobeLeftLapel", Vector3(-13.70, 1.78, 8.045), Vector3(0.14, 0.70, 0.025), textile)
	left_lapel.rotation_degrees.z = -22.0
	var right_lapel := _box(root, "BathrobeRightLapel", Vector3(-13.40, 1.78, 8.042), Vector3(0.14, 0.70, 0.025), textile)
	right_lapel.rotation_degrees.z = 22.0
	var robe_belt := MeshInstance3D.new()
	robe_belt.name = "BathrobeTiedBelt"
	var robe_belt_mesh := TorusMesh.new()
	robe_belt_mesh.inner_radius = 0.315
	robe_belt_mesh.outer_radius = 0.345
	robe_belt_mesh.rings = 48
	robe_belt_mesh.ring_segments = 10
	robe_belt_mesh.material = textile
	robe_belt.mesh = robe_belt_mesh
	robe_belt.position = Vector3(-13.55, 1.34, 8.17)
	robe_belt.scale = Vector3(1.0, 0.55, 0.34)
	root.add_child(robe_belt)
	_sphere(root, "BathrobeBeltKnot", Vector3(-13.55, 1.32, 8.035), Vector3(0.09, 0.07, 0.04), textile)
	for knot_side in [-1.0, 1.0]:
		var belt_tail := _box(root, "BathrobeBeltTail", Vector3(-13.55 + knot_side * 0.075, 1.12, 8.035), Vector3(0.075, 0.40, 0.024), textile)
		belt_tail.rotation_degrees.z = knot_side * 11.0
	for pocket_x in [-13.82, -13.28]:
		_sphere(root, "BathrobePatchPocket", Vector3(pocket_x, 1.02, 8.045), Vector3(0.17, 0.15, 0.035), cream)
	for fold_x in [-13.88, -13.66, -13.44, -13.22]:
		_box(root, "BathrobeLowerFold", Vector3(fold_x, 0.79, 8.045), Vector3(0.018, 0.62, 0.020), textile)

	# A warm wash over the vanity balances the cooler translucent glazing.
	bathroom_detail_lights.append(_add_warm_spot(root, Vector3(-11.45, 3.02, 11.10), Vector3(-11.45, 1.05, 10.35), 1.25, 4.4))


func _build_living_details() -> void:
	var root := Node3D.new()
	root.name = "LivingRoomLayer"
	add_child(root)
	# A low elliptical woven rug replaces the hard rectangular slab. Rolled
	# binding, inset border and shallow pile islands give it a textile edge.
	_cylinder(root, "LivingRugPile", Vector3(0.15, 0.022, 4.15), 1.0, 1.0, 0.032, cream, Vector3(3.30, 1.0, 2.16))
	var rug_binding := MeshInstance3D.new()
	rug_binding.name = "LivingRugRolledBinding"
	var binding_mesh := TorusMesh.new()
	binding_mesh.inner_radius = 0.965
	binding_mesh.outer_radius = 1.0
	binding_mesh.rings = 72
	binding_mesh.ring_segments = 12
	binding_mesh.material = textile
	rug_binding.mesh = binding_mesh
	rug_binding.position = Vector3(0.15, 0.043, 4.15)
	rug_binding.scale = Vector3(3.30, 0.72, 2.16)
	root.add_child(rug_binding)

	var rug_inlay := MeshInstance3D.new()
	rug_inlay.name = "LivingRugInsetBorder"
	var inlay_mesh := TorusMesh.new()
	inlay_mesh.inner_radius = 0.785
	inlay_mesh.outer_radius = 0.805
	inlay_mesh.rings = 72
	inlay_mesh.ring_segments = 10
	inlay_mesh.material = textile
	rug_inlay.mesh = inlay_mesh
	rug_inlay.position = Vector3(0.15, 0.047, 4.15)
	rug_inlay.scale = Vector3(3.30, 0.45, 2.16)
	root.add_child(rug_inlay)

	for tuft_data in [
		Vector3(-2.42, 0.0, 3.42), Vector3(-1.78, 0.0, 5.18),
		Vector3(-0.92, 0.0, 2.45), Vector3(-0.36, 0.0, 5.76),
		Vector3(0.54, 0.0, 2.32), Vector3(1.16, 0.0, 5.83),
		Vector3(1.92, 0.0, 2.78), Vector3(2.56, 0.0, 4.90)
	]:
		_sphere(root, "LivingRugPileTuft", Vector3(tuft_data.x, 0.046, tuft_data.z), Vector3(0.18, 0.010, 0.12), cream)

	# Loose decorative cushions and a draped throw sit on the authored sectional.
	# Ellipsoidal fill, corner pinches and seam piping keep them visibly soft.
	for cushion_data in [
		Vector4(-1.10, 0.78, 4.69, -7.0),
		Vector4(0.12, 0.80, 4.72, 4.0),
		Vector4(1.12, 0.76, 4.66, -3.0)
	]:
		var cushion := _sphere(root, "SectionalLooseCushion", Vector3(cushion_data.x, cushion_data.y, cushion_data.z), Vector3(0.39, 0.16, 0.34), cream)
		cushion.rotation_degrees.y = cushion_data.w
		for side in [-1.0, 1.0]:
			_sphere(root, "CushionPinchedCorner", Vector3(cushion_data.x + side * 0.35, cushion_data.y, cushion_data.z), Vector3(0.055, 0.07, 0.06), cream)
		_box(root, "CushionTopSeam", Vector3(cushion_data.x, cushion_data.y + 0.15, cushion_data.z - 0.02), Vector3(0.62, 0.012, 0.018), champagne)

	_sphere(root, "SectionalThrowMainFold", Vector3(1.48, 0.68, 3.88), Vector3(0.58, 0.055, 0.45), textile)
	_sphere(root, "SectionalThrowCascade", Vector3(1.80, 0.48, 3.80), Vector3(0.28, 0.31, 0.055), textile)
	for z in [3.54, 3.66, 3.78, 3.90, 4.02]:
		_box(root, "SectionalThrowFringe", Vector3(2.06, 0.25, z), Vector3(0.13, 0.012, 0.012), textile)
	# The sculptural oval table and soft planting break up the room's box-heavy silhouette.
	_cylinder(root, "LowCoffeeTable", Vector3(0.25, 0.35, 6.15), 0.95, 0.95, 0.16, pale_stone(), Vector3(1.22, 1.0, 0.58))
	_cylinder(root, "CoffeeTablePedestal", Vector3(0.25, 0.18, 6.15), 0.32, 0.46, 0.34, champagne, Vector3(1.15, 1.0, 0.82))
	_add_collision_box(root, "CoffeeTableCollision", Vector3(0.25, 0.35, 6.15), Vector3(2.35, 0.70, 1.15))
	_cylinder(root, "CeramicTray", Vector3(0.05, 0.455, 6.1), 0.28, 0.30, 0.045, ceramic, Vector3(1.35, 1.0, 0.72))
	_sphere(root, "DecorativeStone", Vector3(0.02, 0.54, 6.08), Vector3(0.12, 0.08, 0.10), charcoal)

	# Layered reading and coffee service make the table usable at close range.
	var coffee_material := StandardMaterial3D.new()
	coffee_material.albedo_color = Color(0.24, 0.10, 0.045, 0.72)
	coffee_material.roughness = 0.18
	coffee_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_cylinder(root, "CoffeeCarafeFoot", Vector3(-0.32, 0.485, 6.12), 0.075, 0.095, 0.025, crystal)
	_cylinder(root, "CoffeeCarafeBody", Vector3(-0.32, 0.595, 6.12), 0.065, 0.105, 0.20, crystal)
	_cylinder(root, "CoffeeCarafeDrink", Vector3(-0.32, 0.565, 6.12), 0.055, 0.088, 0.11, coffee_material)
	_cylinder(root, "CoffeeCarafeNeck", Vector3(-0.32, 0.715, 6.12), 0.040, 0.060, 0.08, crystal)
	_cylinder(root, "CoffeeCarafeStopper", Vector3(-0.32, 0.775, 6.12), 0.050, 0.042, 0.045, champagne)
	for cup_data in [
		Vector3(-0.08, 0.505, 5.92),
		Vector3(0.12, 0.505, 5.88)
	]:
		_cylinder(root, "CoffeeCup", cup_data, 0.065, 0.055, 0.095, ceramic)
		_cylinder(root, "CoffeeCupDrink", cup_data + Vector3(0.0, 0.051, 0.0), 0.053, 0.053, 0.008, coffee_material)
		var cup_handle := MeshInstance3D.new()
		cup_handle.name = "CoffeeCupHandle"
		var cup_handle_mesh := TorusMesh.new()
		cup_handle_mesh.inner_radius = 0.030
		cup_handle_mesh.outer_radius = 0.043
		cup_handle_mesh.rings = 24
		cup_handle_mesh.ring_segments = 8
		cup_handle_mesh.material = ceramic
		cup_handle.mesh = cup_handle_mesh
		cup_handle.position = cup_data + Vector3(0.072, 0.0, 0.0)
		cup_handle.rotation_degrees.x = 90.0
		root.add_child(cup_handle)

	# Two detailed art books expose page blocks, raised covers and a bookmark.
	var coffee_book_colors := [textile, walnut]
	for layer in range(2):
		var book_y := 0.475 + float(layer) * 0.075
		var book_z := 6.20 - float(layer) * 0.035
		_box(root, "CoffeeTableBookCover", Vector3(0.82, book_y, book_z), Vector3(0.78 - float(layer) * 0.06, 0.065, 0.52), coffee_book_colors[layer])
		_box(root, "CoffeeTableBookPages", Vector3(0.82, book_y, book_z - 0.275), Vector3(0.70 - float(layer) * 0.06, 0.038, 0.025), cream)
		_box(root, "CoffeeTableBookSpine", Vector3(0.42 + float(layer) * 0.03, book_y, book_z), Vector3(0.028, 0.075, 0.52), champagne)
	_box(root, "CoffeeTableBookmark", Vector3(0.98, 0.588, 6.46), Vector3(0.035, 0.012, 0.24), champagne)

	_cylinder(root, "CoffeeTableCandleCup", Vector3(0.56, 0.515, 5.72), 0.085, 0.095, 0.12, crystal)
	_cylinder(root, "CoffeeTableCandleWax", Vector3(0.56, 0.555, 5.72), 0.070, 0.078, 0.075, cream)
	_sphere(root, "CoffeeTableCandleFlame", Vector3(0.56, 0.655, 5.72), Vector3(0.026, 0.055, 0.026), warm_glow)
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
	# Layered ceiling canopy, braided drop and a spun-metal bell create a clear
	# jewellery-like silhouette instead of a cylinder hanging from a box.
	_cylinder(parent, "PendantCeilingPlate", ceiling_origin + Vector3(0.0, -0.025, 0.0), 0.16, 0.16, 0.035, champagne)
	_cylinder(parent, "PendantCanopy", ceiling_origin + Vector3(0.0, -0.07, 0.0), 0.105, 0.15, 0.07, charcoal)
	_sphere(parent, "PendantSwivel", ceiling_origin + Vector3(0.0, -0.12, 0.0), Vector3(0.055, 0.045, 0.055), champagne)
	_cylinder(parent, "PendantBraidedCord", ceiling_origin + Vector3(0.0, -0.50, 0.0), 0.012, 0.012, 0.76, charcoal)
	_cylinder(parent, "PendantNeck", ceiling_origin + Vector3(0.0, -0.90, 0.0), 0.055, 0.075, 0.10, champagne)

	# A three-stage shade catches highlights across curved profiles. The pale
	# reflector and translucent diffuser are separate physical layers.
	_cylinder(parent, "PendantUpperBell", ceiling_origin + Vector3(0.0, -1.02, 0.0), 0.10, 0.27, 0.25, charcoal)
	_cylinder(parent, "PendantLowerBell", ceiling_origin + Vector3(0.0, -1.17, 0.0), 0.27, 0.36, 0.13, charcoal)
	_cylinder(parent, "PendantInnerReflector", ceiling_origin + Vector3(0.0, -1.17, 0.0), 0.22, 0.31, 0.07, cream)
	_sphere(parent, "PendantGlassDiffuser", ceiling_origin + Vector3(0.0, -1.26, 0.0), Vector3(0.255, 0.115, 0.255), crystal)
	_sphere(parent, "PendantVisibleBulb", ceiling_origin + Vector3(0.0, -1.245, 0.0), Vector3(0.085, 0.105, 0.085), warm_glow)

	var rim := MeshInstance3D.new()
	rim.name = "PendantRolledRim"
	var rim_mesh := TorusMesh.new()
	rim_mesh.inner_radius = 0.335
	rim_mesh.outer_radius = 0.365
	rim_mesh.rings = 48
	rim_mesh.ring_segments = 12
	rim_mesh.material = champagne
	rim.mesh = rim_mesh
	rim.position = ceiling_origin + Vector3(0.0, -1.235, 0.0)
	parent.add_child(rim)

	var light := OmniLight3D.new()
	light.name = "PendantGlow"
	light.position = ceiling_origin + Vector3(0.0, -1.29, 0.0)
	light.light_color = Color("ffd4a0")
	light.light_energy = 0.64
	light.omni_range = 3.35
	light.shadow_enabled = true
	parent.add_child(light)
	return light

func _add_table_lamp(parent: Node3D, origin: Vector3, scale_factor := 1.0) -> OmniLight3D:
	# A layered ceramic body, stepped neck and tailored shade replace the former
	# box stem. The same authored lamp scales cleanly for bedside and study use.
	_cylinder(parent, "TableLampWeightedFoot", origin + Vector3(0.0, 0.025 * scale_factor, 0.0), 0.18 * scale_factor, 0.20 * scale_factor, 0.05 * scale_factor, champagne)
	_sphere(parent, "TableLampCeramicBody", origin + Vector3(0.0, 0.18 * scale_factor, 0.0), Vector3(0.16, 0.17, 0.16) * scale_factor, ceramic)
	_sphere(parent, "TableLampBodyShoulder", origin + Vector3(0.0, 0.29 * scale_factor, 0.0), Vector3(0.11, 0.09, 0.11) * scale_factor, ceramic)
	_cylinder(parent, "TableLampNeck", origin + Vector3(0.0, 0.37 * scale_factor, 0.0), 0.035 * scale_factor, 0.055 * scale_factor, 0.13 * scale_factor, champagne)
	_cylinder(parent, "TableLampSocket", origin + Vector3(0.0, 0.425 * scale_factor, 0.0), 0.055 * scale_factor, 0.065 * scale_factor, 0.055 * scale_factor, charcoal)

	var shade := MeshInstance3D.new()
	shade.name = "TailoredTableLampShade"
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.14 * scale_factor
	mesh.bottom_radius = 0.25 * scale_factor
	mesh.height = 0.30 * scale_factor
	mesh.radial_segments = 48
	mesh.material = cream
	shade.mesh = mesh
	shade.position = origin + Vector3(0.0, 0.57 * scale_factor, 0.0)
	parent.add_child(shade)

	# Fine vertical ribs create a visibly tailored, pleated shade surface.
	for angle in range(0, 360, 30):
		var angle_radians := deg_to_rad(float(angle))
		var rib_radius := 0.195 * scale_factor
		var rib := _box(
			parent,
			"TableLampShadePleat",
			origin + Vector3(sin(angle_radians) * rib_radius, 0.57 * scale_factor, cos(angle_radians) * rib_radius),
			Vector3(0.010, 0.27, 0.012) * scale_factor,
			textile
		)
		rib.rotation_degrees.y = float(angle)

	for rim_data in [
		[0.135, 0.148, 0.715],
		[0.242, 0.258, 0.420]
	]:
		var rim := MeshInstance3D.new()
		rim.name = "TableLampShadeRolledRim"
		var rim_mesh := TorusMesh.new()
		rim_mesh.inner_radius = rim_data[0] * scale_factor
		rim_mesh.outer_radius = rim_data[1] * scale_factor
		rim_mesh.rings = 48
		rim_mesh.ring_segments = 10
		rim_mesh.material = champagne
		rim.mesh = rim_mesh
		rim.position = origin + Vector3(0.0, rim_data[2] * scale_factor, 0.0)
		parent.add_child(rim)

	_sphere(parent, "TableLampGlassDiffuser", origin + Vector3(0.0, 0.43 * scale_factor, 0.0), Vector3(0.15, 0.075, 0.15) * scale_factor, crystal)
	_sphere(parent, "TableLampVisibleBulb", origin + Vector3(0.0, 0.46 * scale_factor, 0.0), Vector3(0.055, 0.075, 0.055) * scale_factor, warm_glow)

	var light := OmniLight3D.new()
	light.name = "TableLampGlow"
	light.position = origin + Vector3(0.0, 0.47 * scale_factor, 0.0)
	light.light_color = Color("ffd4a0")
	light.light_energy = 0.76
	light.omni_range = 2.85 * scale_factor
	light.shadow_enabled = true
	parent.add_child(light)
	return light

func _add_floor_lamp(parent: Node3D, origin: Vector3) -> OmniLight3D:
	# Weighted disc base, stepped stem and articulated arcing arm give the
	# living lamp a furniture-grade silhouette rather than a pole and cone.
	_cylinder(parent, "FloorLampWeightedBase", origin + Vector3(0.0, 0.045, 0.0), 0.30, 0.34, 0.09, charcoal)
	_cylinder(parent, "FloorLampBaseInlay", origin + Vector3(0.0, 0.098, 0.0), 0.22, 0.25, 0.025, champagne)
	_cylinder(parent, "FloorLampLowerStem", origin + Vector3(0.0, 0.73, 0.0), 0.028, 0.040, 1.30, champagne)
	_cylinder(parent, "FloorLampStemCollar", origin + Vector3(0.0, 1.38, 0.0), 0.060, 0.060, 0.085, charcoal)

	var lower_arm := _cylinder(parent, "FloorLampLowerArm", origin + Vector3(0.15, 1.55, 0.0), 0.025, 0.030, 0.46, champagne)
	lower_arm.rotation_degrees.z = -38.0
	var elbow := _sphere(parent, "FloorLampElbowJoint", origin + Vector3(0.29, 1.72, 0.0), Vector3(0.058, 0.058, 0.058), charcoal)
	elbow.rotation_degrees.z = -18.0
	var upper_arm := _cylinder(parent, "FloorLampUpperArm", origin + Vector3(0.49, 1.82, 0.0), 0.022, 0.027, 0.46, champagne)
	upper_arm.rotation_degrees.z = -67.0
	_sphere(parent, "FloorLampShadeJoint", origin + Vector3(0.70, 1.88, 0.0), Vector3(0.052, 0.052, 0.052), champagne)

	# Layered metal dome, pale reflector, glass diffuser and visible bulb.
	_cylinder(parent, "FloorLampShadeNeck", origin + Vector3(0.70, 1.80, 0.0), 0.055, 0.075, 0.10, champagne)
	_cylinder(parent, "FloorLampDome", origin + Vector3(0.70, 1.65, 0.0), 0.14, 0.34, 0.28, charcoal)
	_cylinder(parent, "FloorLampReflector", origin + Vector3(0.70, 1.52, 0.0), 0.24, 0.30, 0.065, cream)
	_sphere(parent, "FloorLampGlassDiffuser", origin + Vector3(0.70, 1.45, 0.0), Vector3(0.22, 0.10, 0.22), crystal)
	_sphere(parent, "FloorLampVisibleBulb", origin + Vector3(0.70, 1.48, 0.0), Vector3(0.075, 0.095, 0.075), warm_glow)

	var rim := MeshInstance3D.new()
	rim.name = "FloorLampRolledRim"
	var rim_mesh := TorusMesh.new()
	rim_mesh.inner_radius = 0.31
	rim_mesh.outer_radius = 0.345
	rim_mesh.rings = 48
	rim_mesh.ring_segments = 12
	rim_mesh.material = champagne
	rim.mesh = rim_mesh
	rim.position = origin + Vector3(0.70, 1.505, 0.0)
	parent.add_child(rim)

	var light := OmniLight3D.new()
	light.name = "FloorLampGlow"
	light.position = origin + Vector3(0.70, 1.42, 0.0)
	light.light_color = Color("ffd4a0")
	light.light_energy = 1.12
	light.omni_range = 4.4
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
