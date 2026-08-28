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

	# Bedside objects are individually modeled at hand scale. The left table
	# carries a page-built book and spectacles; the right carries a water carafe,
	# drinking glass, slim phone and visible charging lead.
	_box(root, "BedsideBookCover", Vector3(-13.69, 0.772, -7.48), Vector3(0.30, 0.035, 0.22), walnut)
	_box(root, "BedsideBookPages", Vector3(-13.69, 0.798, -7.48), Vector3(0.27, 0.025, 0.19), cream)
	_box(root, "BedsideBookSpine", Vector3(-13.85, 0.812, -7.48), Vector3(0.025, 0.055, 0.22), champagne)
	_box(root, "BedsideBookRibbon", Vector3(-13.62, 0.820, -7.58), Vector3(0.028, 0.010, 0.12), textile)
	for lens_x in [-13.76, -13.61]:
		var lens_ring := MeshInstance3D.new()
		lens_ring.name = "BedsideReadingGlassLens"
		var lens_ring_mesh := TorusMesh.new()
		lens_ring_mesh.inner_radius = 0.050
		lens_ring_mesh.outer_radius = 0.058
		lens_ring_mesh.rings = 24
		lens_ring_mesh.ring_segments = 8
		lens_ring_mesh.material = champagne
		lens_ring.mesh = lens_ring_mesh
		lens_ring.position = Vector3(lens_x, 0.840, -7.48)
		lens_ring.scale = Vector3(1.25, 0.55, 0.86)
		root.add_child(lens_ring)
	_box(root, "BedsideReadingGlassBridge", Vector3(-13.685, 0.842, -7.48), Vector3(0.055, 0.010, 0.012), champagne)
	for arm_x in [-13.84, -13.53]:
		var glass_arm := _box(root, "BedsideReadingGlassArm", Vector3(arm_x, 0.838, -7.40), Vector3(0.012, 0.010, 0.18), champagne)
		glass_arm.rotation_degrees.y = -8.0 if arm_x < -13.7 else 8.0

	var bedside_water := StandardMaterial3D.new()
	bedside_water.albedo_color = Color(0.34, 0.66, 0.74, 0.38)
	bedside_water.roughness = 0.08
	bedside_water.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_cylinder(root, "BedsideWaterCarafeFoot", Vector3(-9.68, 0.805, -7.50), 0.075, 0.090, 0.025, crystal)
	_sphere(root, "BedsideWaterCarafeBody", Vector3(-9.68, 0.925, -7.50), Vector3(0.105, 0.15, 0.105), crystal)
	_sphere(root, "BedsideWaterCarafeFill", Vector3(-9.68, 0.900, -7.50), Vector3(0.085, 0.095, 0.085), bedside_water)
	_cylinder(root, "BedsideWaterCarafeNeck", Vector3(-9.68, 1.075, -7.50), 0.040, 0.060, 0.16, crystal)
	_cylinder(root, "BedsideWaterGlass", Vector3(-9.46, 0.855, -7.48), 0.060, 0.050, 0.14, crystal)
	_cylinder(root, "BedsideWaterGlassFill", Vector3(-9.46, 0.825, -7.48), 0.048, 0.045, 0.065, bedside_water)

	_box(root, "BedsidePhoneBody", Vector3(-9.25, 0.784, -7.50), Vector3(0.14, 0.025, 0.25), charcoal)
	_box(root, "BedsidePhoneScreen", Vector3(-9.25, 0.801, -7.50), Vector3(0.125, 0.010, 0.22), mirror)
	_sphere(root, "BedsidePhoneCamera", Vector3(-9.29, 0.812, -7.58), Vector3(0.012, 0.006, 0.012), champagne)
	for cable_index in range(7):
		var cable_angle := float(cable_index) * 0.45
		_sphere(
			root,
			"BedsideChargingCable",
			Vector3(-9.25 + float(cable_index) * 0.035, 0.790, -7.63 + sin(cable_angle) * 0.055),
			Vector3(0.022, 0.008, 0.022),
			charcoal
		)

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

	# A draped evening dress gives the wardrobe a full garment silhouette.
	# Separate bodice, waist, layered skirt gores, straps and hem folds replace
	# any single hanging rectangle and catch light differently as the player moves.
	# Procedural satin shifts sheen across folds as the player moves; fine warp
	# variation prevents the dress reading as uniformly coloured plastic.
	var dress_satin_shader := Shader.new()
	dress_satin_shader.code = """
shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

void fragment() {
	float warp = sin(UV.y * 260.0 + sin(UV.x * 24.0) * 2.4) * 0.5 + 0.5;
	float cross_thread = sin(UV.x * 190.0) * 0.5 + 0.5;
	float weave = warp * 0.72 + cross_thread * 0.28;
	float fresnel = pow(1.0 - clamp(dot(normalize(NORMAL), normalize(VIEW)), 0.0, 1.0), 2.2);
	vec3 base = vec3(0.463, 0.329, 0.365);
	ALBEDO = base * (0.92 + weave * 0.10) + vec3(0.09, 0.055, 0.065) * fresnel;
	ROUGHNESS = 0.24 + weave * 0.09;
	METALLIC = 0.08;
	SPECULAR = 0.86;
}
"""
	var dress_satin := ShaderMaterial.new()
	dress_satin.shader = dress_satin_shader
	var dress_lining := StandardMaterial3D.new()
	dress_lining.albedo_color = Color("c8a9a4")
	dress_lining.roughness = 0.56
	# Jewellery-like hanger and hook.
	var dress_hook := MeshInstance3D.new()
	dress_hook.name = "EveningDressHangerHook"
	var dress_hook_mesh := TorusMesh.new()
	dress_hook_mesh.inner_radius = 0.060
	dress_hook_mesh.outer_radius = 0.075
	dress_hook_mesh.rings = 28
	dress_hook_mesh.ring_segments = 8
	dress_hook_mesh.material = champagne
	dress_hook.mesh = dress_hook_mesh
	dress_hook.position = Vector3(-10.62, 2.65, 1.82)
	dress_hook.rotation_degrees.x = 90.0
	root.add_child(dress_hook)
	for shoulder_side in [-1.0, 1.0]:
		var hanger_arm := _cylinder(root, "EveningDressHangerArm", Vector3(-10.62 + shoulder_side * 0.17, 2.50, 1.82), 0.012, 0.015, 0.40, champagne)
		hanger_arm.rotation_degrees.z = shoulder_side * 57.0
	_box(root, "EveningDressHangerBar", Vector3(-10.62, 2.34, 1.82), Vector3(0.56, 0.025, 0.025), champagne)

	for strap_side in [-1.0, 1.0]:
		var strap := _cylinder(root, "EveningDressShoulderStrap", Vector3(-10.62 + strap_side * 0.17, 2.28, 1.80), 0.014, 0.016, 0.38, dress_satin)
		strap.rotation_degrees.z = strap_side * 8.0
	_sphere(root, "EveningDressBodice", Vector3(-10.62, 2.03, 1.82), Vector3(0.31, 0.36, 0.105), dress_satin)
	_sphere(root, "EveningDressNecklineLeft", Vector3(-10.76, 2.30, 1.74), Vector3(0.17, 0.070, 0.035), dress_lining)
	_sphere(root, "EveningDressNecklineRight", Vector3(-10.48, 2.30, 1.74), Vector3(0.17, 0.070, 0.035), dress_lining)
	_sphere(root, "EveningDressWaist", Vector3(-10.62, 1.72, 1.82), Vector3(0.30, 0.085, 0.11), dress_lining)

	# Overlapping gores widen toward the hem and alternate depth, producing
	# highlights and shadow folds instead of one flat skirt panel.
	for gore_data in [
		Vector4(-0.31, 1.20, 0.24, -8.0),
		Vector4(-0.15, 1.13, 0.30, -4.0),
		Vector4(0.0, 1.08, 0.34, 0.0),
		Vector4(0.16, 1.12, 0.30, 4.0),
		Vector4(0.32, 1.18, 0.24, 8.0)
	]:
		var skirt_gore := _sphere(root, "EveningDressSkirtGore", Vector3(-10.62 + gore_data.x, gore_data.y, 1.82 + abs(gore_data.x) * 0.045), Vector3(gore_data.z, 0.66, 0.115), dress_satin)
		skirt_gore.rotation_degrees.z = gore_data.w
	for hem_x in [-10.94, -10.78, -10.62, -10.45, -10.29]:
		_sphere(root, "EveningDressSoftHem", Vector3(hem_x, 0.50 + abs(hem_x + 10.62) * 0.06, 1.82), Vector3(0.19, 0.075, 0.13), dress_lining)
	for pleat_x in [-10.86, -10.70, -10.54, -10.38]:
		_box(root, "EveningDressPleatHighlight", Vector3(pleat_x, 1.12, 1.695), Vector3(0.016, 1.05, 0.016), dress_lining)

	# A freestanding valet carries a complete tailored suit and folded trousers.
	# Rounded shoulder structure, separated sleeves, lapels, buttons, waistband,
	# twin legs and pressed creases give it unmistakable garment anatomy.
	# Fine herringbone weave modulates both tone and roughness across the suit.
	# The material remains restrained at room scale but resolves when approached.
	var suit_weave_shader := Shader.new()
	suit_weave_shader.code = """
shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

void fragment() {
	float diagonal_a = sin((UV.x + UV.y * 0.72) * 220.0);
	float diagonal_b = sin((UV.x - UV.y * 0.72) * 220.0);
	float herringbone = abs(diagonal_a - diagonal_b) * 0.5;
	float fine_thread = sin(UV.y * 420.0) * 0.5 + 0.5;
	float weave = clamp(herringbone * 0.72 + fine_thread * 0.28, 0.0, 1.0);
	vec3 base = vec3(0.188, 0.224, 0.263);
	ALBEDO = base * (0.90 + weave * 0.12);
	ROUGHNESS = 0.76 + weave * 0.12;
	METALLIC = 0.0;
	SPECULAR = 0.34;
}
"""
	var suit_material := ShaderMaterial.new()
	suit_material.shader = suit_weave_shader
	var suit_lining := StandardMaterial3D.new()
	suit_lining.albedo_color = Color("8a7769")
	suit_lining.roughness = 0.72
	_cylinder(root, "ValetStandFoot", Vector3(-9.18, 0.08, 4.30), 0.26, 0.32, 0.10, charcoal, Vector3(1.28, 1.0, 0.74))
	_cylinder(root, "ValetStandPost", Vector3(-9.18, 1.18, 4.30), 0.025, 0.040, 2.20, champagne)
	_sphere(root, "ValetStandShoulderRail", Vector3(-9.18, 2.16, 4.30), Vector3(0.48, 0.09, 0.10), walnut)
	for shoulder_side in [-1.0, 1.0]:
		_sphere(root, "ValetStandShoulderCap", Vector3(-9.18 + shoulder_side * 0.44, 2.12, 4.30), Vector3(0.12, 0.09, 0.11), walnut)
	_box(root, "ValetTrouserRail", Vector3(-9.18, 1.44, 4.30), Vector3(0.76, 0.035, 0.035), champagne)

	_sphere(root, "ValetSuitJacketShoulders", Vector3(-9.18, 2.02, 4.32), Vector3(0.48, 0.18, 0.13), suit_material)
	_sphere(root, "ValetSuitJacketLeftBody", Vector3(-9.38, 1.66, 4.32), Vector3(0.28, 0.44, 0.13), suit_material)
	_sphere(root, "ValetSuitJacketRightBody", Vector3(-8.98, 1.66, 4.32), Vector3(0.28, 0.44, 0.13), suit_material)
	var valet_left_sleeve := _sphere(root, "ValetSuitLeftSleeve", Vector3(-9.64, 1.65, 4.31), Vector3(0.14, 0.45, 0.12), suit_material)
	valet_left_sleeve.rotation_degrees.z = 8.0
	var valet_right_sleeve := _sphere(root, "ValetSuitRightSleeve", Vector3(-8.72, 1.65, 4.31), Vector3(0.14, 0.45, 0.12), suit_material)
	valet_right_sleeve.rotation_degrees.z = -8.0
	_sphere(root, "ValetSuitLeftCuff", Vector3(-9.70, 1.26, 4.31), Vector3(0.15, 0.07, 0.13), suit_lining)
	_sphere(root, "ValetSuitRightCuff", Vector3(-8.66, 1.26, 4.31), Vector3(0.15, 0.07, 0.13), suit_lining)
	var valet_left_lapel := _box(root, "ValetSuitLeftLapel", Vector3(-9.33, 1.81, 4.175), Vector3(0.13, 0.58, 0.025), suit_lining)
	valet_left_lapel.rotation_degrees.z = -24.0
	var valet_right_lapel := _box(root, "ValetSuitRightLapel", Vector3(-9.03, 1.81, 4.175), Vector3(0.13, 0.58, 0.025), suit_lining)
	valet_right_lapel.rotation_degrees.z = 24.0
	# A separate shirt front, collar and tied neckwear create real layer order
	# beneath the lapels instead of painting formalwear detail onto the jacket.
	var shirt_material := StandardMaterial3D.new()
	shirt_material.albedo_color = Color("d7d2c8")
	shirt_material.roughness = 0.76
	var tie_material := StandardMaterial3D.new()
	tie_material.albedo_color = Color("6a3c3c")
	tie_material.roughness = 0.58
	_box(root, "ValetSuitShirtFront", Vector3(-9.18, 1.85, 4.188), Vector3(0.18, 0.50, 0.018), shirt_material)
	var shirt_collar_left := _box(root, "ValetSuitShirtCollarLeft", Vector3(-9.24, 2.075, 4.168), Vector3(0.10, 0.18, 0.020), shirt_material)
	shirt_collar_left.rotation_degrees.z = -27.0
	var shirt_collar_right := _box(root, "ValetSuitShirtCollarRight", Vector3(-9.12, 2.075, 4.168), Vector3(0.10, 0.18, 0.020), shirt_material)
	shirt_collar_right.rotation_degrees.z = 27.0
	_sphere(root, "ValetSuitTieKnot", Vector3(-9.18, 2.00, 4.142), Vector3(0.065, 0.060, 0.018), tie_material)
	var tie_blade := _box(root, "ValetSuitTieBlade", Vector3(-9.18, 1.76, 4.142), Vector3(0.075, 0.39, 0.018), tie_material)
	tie_blade.rotation_degrees.z = -2.0
	_sphere(root, "ValetSuitTiePoint", Vector3(-9.17, 1.56, 4.142), Vector3(0.055, 0.055, 0.018), tie_material)
	for sleeve_button_x in [-9.745, -8.615]:
		for sleeve_button_y in [1.24, 1.28, 1.32]:
			_sphere(root, "ValetSuitSleeveButton", Vector3(sleeve_button_x, sleeve_button_y, 4.165), Vector3(0.014, 0.014, 0.010), champagne)
	_box(root, "ValetTrouserFlyStitch", Vector3(-9.18, 1.33, 4.010), Vector3(0.012, 0.22, 0.010), suit_lining)
	for button_y in [1.55, 1.42]:
		_sphere(root, "ValetSuitButton", Vector3(-9.18, button_y, 4.16), Vector3(0.025, 0.025, 0.014), champagne)
	for pocket_x in [-9.43, -8.93]:
		_sphere(root, "ValetSuitPocketFlap", Vector3(pocket_x, 1.50, 4.17), Vector3(0.15, 0.035, 0.025), suit_lining)

	# Trousers fold over the rail, separate below the knee and terminate at
	# slightly different hems so the pair never reads as one rectangular strip.
	_sphere(root, "ValetTrouserWaistband", Vector3(-9.18, 1.48, 4.12), Vector3(0.37, 0.075, 0.10), suit_material)
	for leg_data in [
		Vector3(-9.34, 0.99, 4.13),
		Vector3(-9.02, 0.95, 4.13)
	]:
		_sphere(root, "ValetTrouserLeg", leg_data, Vector3(0.17, 0.48, 0.105), suit_material)
		_box(root, "ValetTrouserPressedCrease", Vector3(leg_data.x, leg_data.y, 4.015), Vector3(0.014, 0.72, 0.014), suit_lining)
		_sphere(root, "ValetTrouserHem", Vector3(leg_data.x, leg_data.y - 0.43, 4.13), Vector3(0.18, 0.07, 0.11), suit_lining)



	# A wall-hung trench coat occupies the remaining wardrobe bay as a complete
	# garment: shaped shoulders, articulated sleeves, storm collar, double front,
	# epaulettes, belt, buckle, pockets and separated hem panels.
	var trench_material := StandardMaterial3D.new()
	trench_material.albedo_color = Color("a48b6c")
	trench_material.roughness = 0.82
	var trench_edge := StandardMaterial3D.new()
	trench_edge.albedo_color = Color("5d4b3b")
	trench_edge.roughness = 0.74
	var trench_coat := Node3D.new()
	trench_coat.name = "SculptedWardrobeTrenchCoat"
	trench_coat.position = Vector3(-13.67, 0.0, 3.43)
	trench_coat.rotation_degrees.y = 90.0
	root.add_child(trench_coat)
	var trench_hook := MeshInstance3D.new()
	trench_hook.name = "TrenchCoatHook"
	var trench_hook_mesh := TorusMesh.new()
	trench_hook_mesh.inner_radius = 0.055
	trench_hook_mesh.outer_radius = 0.072
	trench_hook_mesh.rings = 28
	trench_hook_mesh.ring_segments = 8
	trench_hook_mesh.material = champagne
	trench_hook.mesh = trench_hook_mesh
	trench_hook.position = Vector3(0.0, 2.69, 0.0)
	trench_hook.rotation_degrees.x = 90.0
	trench_coat.add_child(trench_hook)
	for hanger_side in [-1.0, 1.0]:
		var trench_hanger_arm := _cylinder(trench_coat, "TrenchHangerArm", Vector3(hanger_side * 0.18, 2.48, 0.0), 0.012, 0.015, 0.40, champagne)
		trench_hanger_arm.rotation_degrees.z = hanger_side * 58.0
	_sphere(trench_coat, "TrenchShoulderYoke", Vector3(0.0, 2.22, 0.0), Vector3(0.46, 0.18, 0.13), trench_material)
	_sphere(trench_coat, "TrenchLeftBodyPanel", Vector3(-0.19, 1.68, 0.0), Vector3(0.27, 0.58, 0.13), trench_material)
	_sphere(trench_coat, "TrenchRightBodyPanel", Vector3(0.19, 1.68, 0.0), Vector3(0.27, 0.58, 0.13), trench_material)
	for sleeve_side in [-1.0, 1.0]:
		var trench_upper_sleeve := _sphere(trench_coat, "TrenchUpperSleeve", Vector3(sleeve_side * 0.48, 1.90, 0.0), Vector3(0.15, 0.36, 0.12), trench_material)
		trench_upper_sleeve.rotation_degrees.z = sleeve_side * 12.0
		var trench_lower_sleeve := _sphere(trench_coat, "TrenchLowerSleeve", Vector3(sleeve_side * 0.56, 1.42, 0.0), Vector3(0.13, 0.30, 0.11), trench_material)
		trench_lower_sleeve.rotation_degrees.z = sleeve_side * 7.0
		_sphere(trench_coat, "TrenchCuffBand", Vector3(sleeve_side * 0.59, 1.16, -0.015), Vector3(0.145, 0.065, 0.125), trench_edge)
		var epaulette := _box(trench_coat, "TrenchEpaulette", Vector3(sleeve_side * 0.34, 2.27, -0.135), Vector3(0.27, 0.045, 0.035), trench_edge)
		epaulette.rotation_degrees.z = sleeve_side * -9.0

	var trench_left_collar := _box(trench_coat, "TrenchLeftStormCollar", Vector3(-0.17, 2.13, -0.145), Vector3(0.20, 0.42, 0.030), trench_edge)
	trench_left_collar.rotation_degrees.z = -31.0
	var trench_right_collar := _box(trench_coat, "TrenchRightStormCollar", Vector3(0.17, 2.13, -0.145), Vector3(0.20, 0.42, 0.030), trench_edge)
	trench_right_collar.rotation_degrees.z = 31.0
	_sphere(trench_coat, "TrenchNeckOpening", Vector3(0.0, 2.31, -0.15), Vector3(0.13, 0.055, 0.025), charcoal)
	_box(trench_coat, "TrenchBelt", Vector3(0.0, 1.53, -0.148), Vector3(0.72, 0.075, 0.025), trench_edge)
	_box(trench_coat, "TrenchBeltBuckle", Vector3(0.18, 1.53, -0.171), Vector3(0.14, 0.13, 0.020), champagne)
	_box(trench_coat, "TrenchBuckleCutout", Vector3(0.18, 1.53, -0.184), Vector3(0.070, 0.065, 0.010), charcoal)
	for trench_button_x in [-0.10, 0.10]:
		for trench_button_y in [1.96, 1.77, 1.60]:
			_sphere(trench_coat, "TrenchDoubleBreastedButton", Vector3(trench_button_x, trench_button_y, -0.165), Vector3(0.024, 0.024, 0.013), champagne)
	for pocket_side in [-1.0, 1.0]:
		var trench_pocket := _box(trench_coat, "TrenchSlantedPocket", Vector3(pocket_side * 0.24, 1.34, -0.153), Vector3(0.21, 0.040, 0.025), trench_edge)
		trench_pocket.rotation_degrees.z = pocket_side * -16.0
	for hem_data in [
		Vector3(-0.28, 0.91, 0.015),
		Vector3(0.0, 0.87, -0.005),
		Vector3(0.28, 0.93, 0.018)
	]:
		_sphere(trench_coat, "TrenchSeparatedHemPanel", hem_data, Vector3(0.22, 0.42, 0.13), trench_material)
	for hem_x in [-0.28, 0.0, 0.28]:
		_sphere(trench_coat, "TrenchSoftHemRoll", Vector3(hem_x, 0.53 + abs(hem_x) * 0.06, 0.015), Vector3(0.23, 0.060, 0.14), trench_edge)


	# A soft leather weekender introduces a genuinely rounded luggage silhouette.
	# Domed end panels, raised piping, twin carry handles, buckled straps, zipper
	# teeth and a hanging tag keep it from reading as another storage cuboid.
	var weekender_leather := StandardMaterial3D.new()
	weekender_leather.albedo_color = Color("71513e")
	weekender_leather.roughness = 0.80
	var weekender_edge := StandardMaterial3D.new()
	weekender_edge.albedo_color = Color("3c2a23")
	weekender_edge.roughness = 0.68
	var weekender_canvas := StandardMaterial3D.new()
	weekender_canvas.albedo_color = Color("c9b594")
	weekender_canvas.roughness = 0.92
	var weekender_body := _sphere(root, "WardrobeWeekenderBody", Vector3(-12.42, 0.42, 2.23), Vector3(0.64, 0.34, 0.33), weekender_leather)
	weekender_body.rotation_degrees.y = -8.0
	for end_side in [-1.0, 1.0]:
		_sphere(root, "WardrobeWeekenderDomedEnd", Vector3(-12.42 + end_side * 0.54, 0.42, 2.23), Vector3(0.18, 0.31, 0.31), weekender_leather)
		var end_pipe := MeshInstance3D.new()
		end_pipe.name = "WardrobeWeekenderEndPiping"
		var end_pipe_mesh := TorusMesh.new()
		end_pipe_mesh.inner_radius = 0.275
		end_pipe_mesh.outer_radius = 0.292
		end_pipe_mesh.rings = 32
		end_pipe_mesh.ring_segments = 8
		end_pipe_mesh.material = weekender_edge
		end_pipe.mesh = end_pipe_mesh
		end_pipe.position = Vector3(-12.42 + end_side * 0.585, 0.42, 2.23)
		end_pipe.rotation_degrees.z = 90.0
		root.add_child(end_pipe)
	for strap_x in [-12.70, -12.14]:
		var luggage_strap := _box(root, "WardrobeWeekenderStrap", Vector3(strap_x, 0.43, 1.915), Vector3(0.085, 0.48, 0.025), weekender_edge)
		luggage_strap.rotation_degrees.z = 5.0 if strap_x < -12.4 else -5.0
		_box(root, "WardrobeWeekenderBuckle", Vector3(strap_x, 0.47, 1.885), Vector3(0.12, 0.13, 0.025), champagne)
		_box(root, "WardrobeWeekenderBuckleCutout", Vector3(strap_x, 0.47, 1.866), Vector3(0.060, 0.070, 0.012), charcoal)
		var carry_handle := MeshInstance3D.new()
		carry_handle.name = "WardrobeWeekenderCarryHandle"
		var carry_handle_mesh := TorusMesh.new()
		carry_handle_mesh.inner_radius = 0.145
		carry_handle_mesh.outer_radius = 0.172
		carry_handle_mesh.rings = 28
		carry_handle_mesh.ring_segments = 8
		carry_handle_mesh.material = weekender_edge
		carry_handle.mesh = carry_handle_mesh
		carry_handle.position = Vector3(strap_x, 0.72, 2.23)
		carry_handle.rotation_degrees.x = 90.0
		carry_handle.scale = Vector3(0.75, 1.0, 1.18)
		root.add_child(carry_handle)
	_box(root, "WardrobeWeekenderZipperTrack", Vector3(-12.42, 0.745, 2.23), Vector3(0.92, 0.018, 0.025), champagne)
	for tooth_index in range(13):
		_box(root, "WardrobeWeekenderZipperTooth", Vector3(-12.84 + float(tooth_index) * 0.070, 0.760, 2.225), Vector3(0.025, 0.014, 0.035), champagne)
	_sphere(root, "WardrobeWeekenderZipperPull", Vector3(-11.94, 0.77, 2.23), Vector3(0.050, 0.018, 0.026), champagne)
	var luggage_tag_cord := _cylinder(root, "WardrobeWeekenderTagCord", Vector3(-12.09, 0.58, 1.89), 0.010, 0.010, 0.25, weekender_edge)
	luggage_tag_cord.rotation_degrees.z = 30.0
	var luggage_tag := _box(root, "WardrobeWeekenderTag", Vector3(-12.02, 0.47, 1.86), Vector3(0.16, 0.22, 0.025), weekender_canvas)
	luggage_tag.rotation_degrees.z = -12.0
	_box(root, "WardrobeWeekenderTagInset", Vector3(-12.02, 0.47, 1.844), Vector3(0.105, 0.115, 0.010), cream)


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


	# A two-tier shoe display adds recognisable footwear anatomy to the wardrobe.
	# Loafers have separated toes, quarters, tongues, straps and welts; the heels
	# use curved uppers, narrow waists, tapered heel posts and ankle straps.
	_box(root, "WardrobeShoeRackLowerShelf", Vector3(-12.65, 0.16, 5.48), Vector3(0.86, 0.055, 0.70), walnut)
	_box(root, "WardrobeShoeRackUpperShelf", Vector3(-12.65, 0.53, 5.48), Vector3(0.86, 0.055, 0.70), walnut)
	for rack_x in [-13.05, -12.25]:
		_cylinder(root, "WardrobeShoeRackPost", Vector3(rack_x, 0.34, 5.80), 0.018, 0.025, 0.42, champagne)
		_cylinder(root, "WardrobeShoeRackPost", Vector3(rack_x, 0.34, 5.16), 0.018, 0.025, 0.42, champagne)

	var loafer_leather := StandardMaterial3D.new()
	loafer_leather.albedo_color = Color("3b2923")
	loafer_leather.roughness = 0.62
	var shoe_welt := StandardMaterial3D.new()
	shoe_welt.albedo_color = Color("211b18")
	shoe_welt.roughness = 0.86
	for shoe_x in [-12.84, -12.49]:
		_sphere(root, "WardrobeLoaferSole", Vector3(shoe_x, 0.225, 5.48), Vector3(0.135, 0.025, 0.30), shoe_welt)
		_sphere(root, "WardrobeLoaferToe", Vector3(shoe_x, 0.285, 5.30), Vector3(0.13, 0.075, 0.17), loafer_leather)
		_sphere(root, "WardrobeLoaferQuarter", Vector3(shoe_x, 0.305, 5.57), Vector3(0.125, 0.105, 0.14), loafer_leather)
		_sphere(root, "WardrobeLoaferOpening", Vector3(shoe_x, 0.365, 5.57), Vector3(0.072, 0.030, 0.085), charcoal)
		var loafer_tongue := _box(root, "WardrobeLoaferTongue", Vector3(shoe_x, 0.365, 5.43), Vector3(0.13, 0.025, 0.15), loafer_leather)
		loafer_tongue.rotation_degrees.x = -12.0
		_box(root, "WardrobeLoaferPennyStrap", Vector3(shoe_x, 0.387, 5.39), Vector3(0.17, 0.025, 0.055), champagne)
		_box(root, "WardrobeLoaferHeel", Vector3(shoe_x, 0.255, 5.72), Vector3(0.17, 0.075, 0.105), shoe_welt)

	var heel_suede := StandardMaterial3D.new()
	heel_suede.albedo_color = Color("835f62")
	heel_suede.roughness = 0.78
	for shoe_x in [-12.84, -12.49]:
		_sphere(root, "WardrobeHeelSole", Vector3(shoe_x, 0.590, 5.47), Vector3(0.105, 0.022, 0.29), shoe_welt)
		var heel_toe := _sphere(root, "WardrobeHeelToeUpper", Vector3(shoe_x, 0.642, 5.29), Vector3(0.11, 0.070, 0.15), heel_suede)
		heel_toe.rotation_degrees.x = -7.0
		_sphere(root, "WardrobeHeelRearQuarter", Vector3(shoe_x, 0.680, 5.61), Vector3(0.105, 0.12, 0.12), heel_suede)
		var heel_post := _cylinder(root, "WardrobeTaperedHeelPost", Vector3(shoe_x, 0.615, 5.67), 0.025, 0.045, 0.26, heel_suede)
		heel_post.rotation_degrees.x = -7.0
		_box(root, "WardrobeHeelLift", Vector3(shoe_x, 0.485, 5.685), Vector3(0.075, 0.025, 0.075), shoe_welt)
		var ankle_strap := MeshInstance3D.new()
		ankle_strap.name = "WardrobeHeelAnkleStrap"
		var ankle_strap_mesh := TorusMesh.new()
		ankle_strap_mesh.inner_radius = 0.082
		ankle_strap_mesh.outer_radius = 0.098
		ankle_strap_mesh.rings = 24
		ankle_strap_mesh.ring_segments = 8
		ankle_strap_mesh.material = heel_suede
		ankle_strap.mesh = ankle_strap_mesh
		ankle_strap.position = Vector3(shoe_x, 0.785, 5.61)
		ankle_strap.rotation_degrees.x = 90.0
		root.add_child(ankle_strap)
		_sphere(root, "WardrobeHeelStrapBuckle", Vector3(shoe_x + 0.095, 0.785, 5.61), Vector3(0.024, 0.022, 0.018), champagne)


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

	# A complete working set replaces the empty desk-pad look: low-profile
	# keyboard with individual keycaps, curved mouse, notebook, page block and pen.
	var keyboard_base := _box(root, "StudyKeyboardBase", Vector3(14.30, 0.885, 3.14), Vector3(0.72, 0.045, 0.26), champagne)
	keyboard_base.rotation_degrees.x = -3.0
	for key_row in range(3):
		for key_column in range(9):
			var key_width := 0.055 if key_column < 8 else 0.080
			_box(
				root,
				"StudyKeyboardKey",
				Vector3(13.99 + float(key_column) * 0.076, 0.918 + float(key_row) * 0.002, 3.055 + float(key_row) * 0.080),
				Vector3(key_width, 0.018, 0.050),
				cream if (key_row + key_column) % 5 != 0 else textile
			)
	_box(root, "StudyKeyboardSpacebar", Vector3(14.30, 0.922, 3.292), Vector3(0.28, 0.018, 0.045), cream)

	_sphere(root, "StudyMouseBody", Vector3(14.88, 0.925, 3.18), Vector3(0.105, 0.055, 0.145), charcoal)
	_box(root, "StudyMouseCenterSeam", Vector3(14.88, 0.975, 3.115), Vector3(0.012, 0.012, 0.12), champagne)
	_cylinder(root, "StudyMouseWheel", Vector3(14.88, 0.995, 3.13), 0.018, 0.018, 0.035, champagne).rotation_degrees.x = 90.0

	_box(root, "StudyNotebookCover", Vector3(15.08, 0.898, 3.35), Vector3(0.50, 0.035, 0.34), walnut)
	_box(root, "StudyNotebookPages", Vector3(15.08, 0.924, 3.35), Vector3(0.45, 0.025, 0.30), cream)
	_box(root, "StudyNotebookSpine", Vector3(14.84, 0.935, 3.35), Vector3(0.025, 0.045, 0.34), champagne)
	for page_line_z in [3.27, 3.34, 3.41]:
		_box(root, "StudyNotebookRule", Vector3(15.12, 0.941, page_line_z), Vector3(0.30, 0.007, 0.008), textile)
	var study_pen := _cylinder(root, "StudyFountainPen", Vector3(15.23, 0.97, 3.18), 0.012, 0.015, 0.36, charcoal)
	study_pen.rotation_degrees.z = 82.0
	_cylinder(root, "StudyPenCapBand", Vector3(15.36, 0.97, 3.18), 0.018, 0.018, 0.035, champagne).rotation_degrees.z = 82.0
	_cylinder(root, "StudyDeskGrommet", Vector3(13.78, 0.89, 2.78), 0.055, 0.055, 0.025, charcoal)

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

	# A slatted umbrella stand and two fully modeled folded umbrellas give the
	# entrance practical scale: shafts, tapered canopies, rib bands, ferrules and
	# loop handles remain separate rather than collapsing into vertical sticks.
	_cylinder(root, "EntryUmbrellaStandFoot", Vector3(16.62, 0.07, -12.42), 0.20, 0.23, 0.10, charcoal)
	_cylinder(root, "EntryUmbrellaStandBasin", Vector3(16.62, 0.16, -12.42), 0.18, 0.20, 0.09, ceramic)
	var umbrella_stand_rim := MeshInstance3D.new()
	umbrella_stand_rim.name = "EntryUmbrellaStandRim"
	var umbrella_stand_rim_mesh := TorusMesh.new()
	umbrella_stand_rim_mesh.inner_radius = 0.205
	umbrella_stand_rim_mesh.outer_radius = 0.225
	umbrella_stand_rim_mesh.rings = 36
	umbrella_stand_rim_mesh.ring_segments = 8
	umbrella_stand_rim_mesh.material = champagne
	umbrella_stand_rim.mesh = umbrella_stand_rim_mesh
	umbrella_stand_rim.position = Vector3(16.62, 0.76, -12.42)
	root.add_child(umbrella_stand_rim)
	for slat_angle in range(0, 360, 45):
		var slat_radians := deg_to_rad(float(slat_angle))
		_cylinder(
			root,
			"EntryUmbrellaStandSlat",
			Vector3(16.62 + cos(slat_radians) * 0.205, 0.47, -12.42 + sin(slat_radians) * 0.205),
			0.012,
			0.016,
			0.58,
			champagne
		)

	var umbrella_materials := [textile, cream]
	for umbrella_index in range(2):
		var umbrella_x := 16.54 + float(umbrella_index) * 0.17
		var umbrella_z := -12.44 + float(umbrella_index) * 0.05
		var umbrella_material: Material = umbrella_materials[umbrella_index]
		_cylinder(root, "EntryUmbrellaShaft", Vector3(umbrella_x, 0.86, umbrella_z), 0.014, 0.017, 1.30, charcoal)
		_cylinder(root, "EntryUmbrellaFoldedCanopy", Vector3(umbrella_x, 0.68, umbrella_z), 0.045, 0.145, 0.72, umbrella_material)
		_cylinder(root, "EntryUmbrellaRibBand", Vector3(umbrella_x, 0.68, umbrella_z), 0.155, 0.155, 0.028, champagne)
		_sphere(root, "EntryUmbrellaGatheredTip", Vector3(umbrella_x, 1.045, umbrella_z), Vector3(0.065, 0.075, 0.065), umbrella_material)
		_cylinder(root, "EntryUmbrellaFerrule", Vector3(umbrella_x, 0.27, umbrella_z), 0.012, 0.025, 0.12, champagne)
		for rib_angle in range(0, 360, 60):
			var rib_radians := deg_to_rad(float(rib_angle))
			var rib := _cylinder(
				root,
				"EntryUmbrellaCanopyRib",
				Vector3(umbrella_x + cos(rib_radians) * 0.10, 0.68, umbrella_z + sin(rib_radians) * 0.10),
				0.006,
				0.008,
				0.64,
				champagne
			)
			rib.rotation_degrees.z = cos(rib_radians) * 8.0
			rib.rotation_degrees.x = sin(rib_radians) * 8.0
		var umbrella_handle := MeshInstance3D.new()
		umbrella_handle.name = "EntryUmbrellaLoopHandle"
		var umbrella_handle_mesh := TorusMesh.new()
		umbrella_handle_mesh.inner_radius = 0.070
		umbrella_handle_mesh.outer_radius = 0.090
		umbrella_handle_mesh.rings = 28
		umbrella_handle_mesh.ring_segments = 8
		umbrella_handle_mesh.material = walnut
		umbrella_handle.mesh = umbrella_handle_mesh
		umbrella_handle.position = Vector3(umbrella_x, 1.57, umbrella_z)
		umbrella_handle.rotation_degrees.x = 90.0
		umbrella_handle.scale = Vector3(0.82, 1.15, 1.0)
		root.add_child(umbrella_handle)

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


	# A fluted dining sideboard and relief artwork complete the wall opposite the
	# table. Rounded ends, lifted legs and glass service avoid a monolithic cabinet.
	var sideboard := Node3D.new()
	sideboard.name = "DiningFlutedSideboard"
	sideboard.position = Vector3(10.48, 0.0, -3.25)
	root.add_child(sideboard)
	_box(sideboard, "SideboardCenterCarcass", Vector3(0.0, 0.50, 0.0), Vector3(0.62, 0.72, 2.25), walnut)
	_sphere(sideboard, "SideboardRoundedNorthEnd", Vector3(0.0, 0.50, -1.14), Vector3(0.31, 0.36, 0.34), walnut)
	_sphere(sideboard, "SideboardRoundedSouthEnd", Vector3(0.0, 0.50, 1.14), Vector3(0.31, 0.36, 0.34), walnut)
	_box(sideboard, "SideboardStoneTop", Vector3(-0.03, 0.90, 0.0), Vector3(0.72, 0.075, 2.75), pale_stone())
	_box(sideboard, "SideboardShadowPlinth", Vector3(0.03, 0.19, 0.0), Vector3(0.48, 0.12, 2.28), charcoal)
	for leg_z in [-1.03, 1.03]:
		for leg_x in [-0.20, 0.20]:
			_cylinder(sideboard, "SideboardTaperedLeg", Vector3(leg_x, 0.22, leg_z), 0.020, 0.040, 0.42, champagne)
	for flute_z in [-1.04, -0.82, -0.60, -0.38, -0.16, 0.06, 0.28, 0.50, 0.72, 0.94]:
		_cylinder(sideboard, "SideboardDoorFlute", Vector3(-0.325, 0.54, flute_z), 0.028, 0.028, 0.55, champagne)
	for pull_z in [-0.56, 0.56]:
		_box(sideboard, "SideboardInsetPull", Vector3(-0.365, 0.56, pull_z), Vector3(0.025, 0.26, 0.055), charcoal)
	_add_collision_box(sideboard, "DiningSideboardCollision", Vector3(0.0, 0.48, 0.0), Vector3(0.72, 0.96, 2.75))

	# A transparent decanter with visible liquid and two stemmed tasting glasses.
	var amber_service := StandardMaterial3D.new()
	amber_service.albedo_color = Color(0.46, 0.20, 0.075, 0.66)
	amber_service.roughness = 0.16
	amber_service.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_cylinder(sideboard, "SideboardServingTray", Vector3(-0.04, 0.96, -0.34), 0.26, 0.28, 0.030, champagne, Vector3(1.28, 1.0, 0.74))
	_sphere(sideboard, "CrystalDecanterBody", Vector3(-0.06, 1.13, -0.48), Vector3(0.14, 0.16, 0.14), crystal)
	_sphere(sideboard, "CrystalDecanterLiquid", Vector3(-0.06, 1.09, -0.48), Vector3(0.115, 0.085, 0.115), amber_service)
	_cylinder(sideboard, "CrystalDecanterNeck", Vector3(-0.06, 1.31, -0.48), 0.045, 0.065, 0.18, crystal)
	_sphere(sideboard, "CrystalDecanterStopper", Vector3(-0.06, 1.43, -0.48), Vector3(0.065, 0.075, 0.065), champagne)
	for glass_z in [-0.16, 0.08]:
		_cylinder(sideboard, "TastingGlassFoot", Vector3(-0.06, 0.98, glass_z), 0.060, 0.060, 0.012, crystal)
		_cylinder(sideboard, "TastingGlassStem", Vector3(-0.06, 1.08, glass_z), 0.009, 0.009, 0.19, crystal)
		_sphere(sideboard, "TastingGlassBowl", Vector3(-0.06, 1.22, glass_z), Vector3(0.075, 0.105, 0.075), crystal)
		_sphere(sideboard, "TastingGlassPour", Vector3(-0.06, 1.18, glass_z), Vector3(0.060, 0.045, 0.060), amber_service)

	# Wall relief projects into the room, so it reacts to grazing light rather
	# than behaving as another flat framed image.
	_box(root, "DiningReliefBack", Vector3(10.82, 2.05, -3.25), Vector3(0.055, 1.55, 2.20), charcoal)
	_box(root, "DiningReliefFrameNorth", Vector3(10.76, 2.05, -4.38), Vector3(0.12, 1.68, 0.07), champagne)
	_box(root, "DiningReliefFrameSouth", Vector3(10.76, 2.05, -2.12), Vector3(0.12, 1.68, 0.07), champagne)
	_box(root, "DiningReliefFrameTop", Vector3(10.76, 2.86, -3.25), Vector3(0.12, 0.07, 2.20), champagne)
	_box(root, "DiningReliefFrameBottom", Vector3(10.76, 1.24, -3.25), Vector3(0.12, 0.07, 2.20), champagne)
	for relief_data in [
		Vector4(-3.72, 2.28, 0.42, 0.0),
		Vector4(-3.15, 1.84, 0.32, 1.0),
		Vector4(-2.68, 2.34, 0.27, 0.0)
	]:
		var relief_material: Material = ceramic if relief_data.w < 0.5 else champagne
		var relief_disc := _cylinder(root, "DiningWallReliefDisc", Vector3(10.70, relief_data.y, relief_data.x), relief_data.z, relief_data.z, 0.10, relief_material)
		relief_disc.rotation_degrees.z = 90.0


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

	# A proper raised fruit bowl replaces the former three generic spheres.
	# Recognisable apples, pear and a segmented curved banana provide close-range
	# stems, leaves, colour variation and asymmetric silhouettes.
	var apple_material := StandardMaterial3D.new()
	apple_material.albedo_color = Color("8f3f35")
	apple_material.roughness = 0.52
	var pear_material := StandardMaterial3D.new()
	pear_material.albedo_color = Color("8a9460")
	pear_material.roughness = 0.68
	var banana_material := StandardMaterial3D.new()
	banana_material.albedo_color = Color("c7a34e")
	banana_material.roughness = 0.60
	_cylinder(root, "BarFruitBowlFoot", Vector3(1.62, 1.115, -6.02), 0.115, 0.16, 0.055, champagne)
	_sphere(root, "BarFruitBowlBasin", Vector3(1.62, 1.175, -6.02), Vector3(0.42, 0.11, 0.25), ceramic)
	var bowl_rim := MeshInstance3D.new()
	bowl_rim.name = "BarFruitBowlRolledRim"
	var bowl_rim_mesh := TorusMesh.new()
	bowl_rim_mesh.inner_radius = 0.285
	bowl_rim_mesh.outer_radius = 0.315
	bowl_rim_mesh.rings = 40
	bowl_rim_mesh.ring_segments = 10
	bowl_rim_mesh.material = champagne
	bowl_rim.mesh = bowl_rim_mesh
	bowl_rim.position = Vector3(1.62, 1.245, -6.02)
	bowl_rim.scale = Vector3(1.34, 0.65, 0.78)
	root.add_child(bowl_rim)

	for apple_data in [
		Vector3(1.45, 1.31, -6.03),
		Vector3(1.66, 1.33, -5.94)
	]:
		_sphere(root, "BarAppleLowerLobe", apple_data, Vector3(0.105, 0.090, 0.095), apple_material)
		_sphere(root, "BarAppleUpperLobe", apple_data + Vector3(0.0, 0.065, 0.0), Vector3(0.095, 0.070, 0.090), apple_material)
		var apple_stem := _cylinder(root, "BarAppleStem", apple_data + Vector3(0.0, 0.145, 0.0), 0.010, 0.013, 0.075, walnut)
		apple_stem.rotation_degrees.z = 8.0
		var apple_leaf := _sphere(root, "BarAppleLeaf", apple_data + Vector3(0.055, 0.145, 0.0), Vector3(0.075, 0.015, 0.032), leaf_dark)
		apple_leaf.rotation_degrees.z = -18.0

	_sphere(root, "BarPearBody", Vector3(1.81, 1.31, -6.08), Vector3(0.105, 0.115, 0.095), pear_material)
	_sphere(root, "BarPearNeck", Vector3(1.81, 1.43, -6.08), Vector3(0.070, 0.100, 0.065), pear_material)
	var pear_stem := _cylinder(root, "BarPearStem", Vector3(1.84, 1.54, -6.08), 0.010, 0.014, 0.090, walnut)
	pear_stem.rotation_degrees.z = -16.0

	for banana_index in range(6):
		var banana_angle := -34.0 + float(banana_index) * 13.0
		var banana_radians := deg_to_rad(banana_angle)
		var banana_piece := _sphere(
			root,
			"BarBananaSegment",
			Vector3(1.62 + sin(banana_radians) * 0.28, 1.39 + cos(banana_radians) * 0.05, -6.16),
			Vector3(0.085, 0.040, 0.055),
			banana_material
		)
		banana_piece.rotation_degrees.z = -banana_angle
	_sphere(root, "BarBananaStemTip", Vector3(1.47, 1.43, -6.16), Vector3(0.035, 0.030, 0.040), walnut)
	_sphere(root, "BarBananaFlowerTip", Vector3(1.77, 1.43, -6.16), Vector3(0.025, 0.024, 0.032), charcoal)

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

	# The vanity top now has a complete grooming set at hand scale: soap pump,
	# toothbrush cup with individual brushes, lidded jars and a folded face cloth.
	_cylinder(root, "VanitySoapTray", Vector3(-11.86, 1.265, 10.08), 0.16, 0.17, 0.025, champagne, Vector3(1.30, 1.0, 0.72))
	_cylinder(root, "VanitySoapBottle", Vector3(-11.86, 1.39, 10.08), 0.065, 0.078, 0.22, crystal)
	_cylinder(root, "VanitySoapFill", Vector3(-11.86, 1.355, 10.08), 0.055, 0.065, 0.12, cream)
	_cylinder(root, "VanitySoapPumpStem", Vector3(-11.86, 1.535, 10.08), 0.018, 0.024, 0.09, champagne)
	_box(root, "VanitySoapPumpSpout", Vector3(-11.80, 1.575, 10.08), Vector3(0.14, 0.025, 0.030), champagne)

	_cylinder(root, "VanityToothbrushCupFoot", Vector3(-11.50, 1.275, 10.08), 0.075, 0.085, 0.025, champagne)
	_cylinder(root, "VanityToothbrushCup", Vector3(-11.50, 1.385, 10.08), 0.085, 0.070, 0.20, ceramic)
	var brush_colors := [cream, textile, champagne]
	for brush_index in range(3):
		var brush_x := -11.56 + float(brush_index) * 0.06
		var brush := _cylinder(root, "VanityToothbrushHandle", Vector3(brush_x, 1.58, 10.08), 0.010, 0.013, 0.40, brush_colors[brush_index])
		brush.rotation_degrees.z = -5.0 + float(brush_index) * 5.0
		_box(root, "VanityToothbrushHead", Vector3(brush_x, 1.78, 10.08), Vector3(0.045, 0.08, 0.025), cream)
		for bristle_y in [1.79, 1.815]:
			_box(root, "VanityToothbrushBristle", Vector3(brush_x - 0.026, bristle_y, 10.08), Vector3(0.018, 0.008, 0.020), textile)

	for jar_data in [
		Vector3(-11.17, 1.31, 10.04),
		Vector3(-10.98, 1.30, 10.12)
	]:
		_cylinder(root, "VanityCreamJar", jar_data, 0.075, 0.085, 0.08, ceramic)
		_cylinder(root, "VanityCreamJarLid", jar_data + Vector3(0.0, 0.055, 0.0), 0.080, 0.080, 0.025, champagne)
		_sphere(root, "VanityJarKnob", jar_data + Vector3(0.0, 0.083, 0.0), Vector3(0.018, 0.015, 0.018), crystal)

	_sphere(root, "VanityFaceClothMainFold", Vector3(-10.70, 1.29, 10.08), Vector3(0.23, 0.035, 0.15), cream)
	_sphere(root, "VanityFaceClothUpperFold", Vector3(-10.76, 1.335, 10.05), Vector3(0.17, 0.025, 0.12), textile)
	for cloth_x in [-10.85, -10.72, -10.59]:
		_box(root, "VanityFaceClothHem", Vector3(cloth_x, 1.355, 9.94), Vector3(0.012, 0.012, 0.08), champagne)

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

	# A sculptural reading chair gives the window side an organic furniture
	# silhouette. The embracing shell, separate cushions, wings, piping and
	# matching ottoman are layered curved volumes, never a chair-shaped box.
	var reading_chair := Node3D.new()
	reading_chair.name = "SculpturalWindowReadingChair"
	reading_chair.position = Vector3(5.55, 0.0, 7.75)
	reading_chair.rotation_degrees.y = -48.0
	root.add_child(reading_chair)
	_cylinder(reading_chair, "ReadingChairDiscBase", Vector3(0.0, 0.14, 0.0), 0.37, 0.46, 0.09, charcoal)
	_cylinder(reading_chair, "ReadingChairSwivelStem", Vector3(0.0, 0.33, 0.0), 0.065, 0.085, 0.34, champagne)
	_sphere(reading_chair, "ReadingChairUnderShell", Vector3(0.0, 0.58, 0.05), Vector3(0.52, 0.22, 0.48), walnut)
	_sphere(reading_chair, "ReadingChairSeatCushion", Vector3(0.0, 0.67, -0.08), Vector3(0.45, 0.15, 0.39), cream)
	_sphere(reading_chair, "ReadingChairCurvedBackShell", Vector3(0.0, 1.04, 0.32), Vector3(0.54, 0.48, 0.16), walnut)
	_sphere(reading_chair, "ReadingChairBackCushion", Vector3(0.0, 1.04, 0.23), Vector3(0.43, 0.39, 0.16), textile)
	_sphere(reading_chair, "ReadingChairLeftWing", Vector3(-0.43, 0.93, 0.12), Vector3(0.18, 0.35, 0.22), cream)
	_sphere(reading_chair, "ReadingChairRightWing", Vector3(0.43, 0.93, 0.12), Vector3(0.18, 0.35, 0.22), cream)
	_sphere(reading_chair, "ReadingChairLumbarCushion", Vector3(0.0, 0.90, 0.08), Vector3(0.31, 0.15, 0.12), cream)
	for piping_x in [-0.46, 0.46]:
		_cylinder(reading_chair, "ReadingChairSidePiping", Vector3(piping_x, 1.00, 0.12), 0.012, 0.012, 0.58, champagne)
	_sphere(reading_chair, "ReadingChairHeadrest", Vector3(0.0, 1.39, 0.28), Vector3(0.30, 0.12, 0.11), cream)
	_add_collision_box(reading_chair, "ReadingChairCollision", Vector3(0.0, 0.65, 0.10), Vector3(1.05, 1.30, 0.95))
	_add_seat_interaction(reading_chair, "window_reading_chair_seat", "reading chair", Vector3(0.0, 0.02, -0.10), 180.0, Vector3(1.12, 1.35, 1.05))

	var reading_ottoman := Node3D.new()
	reading_ottoman.name = "ReadingChairOttoman"
	reading_ottoman.position = Vector3(4.75, 0.0, 7.02)
	reading_ottoman.rotation_degrees.y = -48.0
	root.add_child(reading_ottoman)
	_cylinder(reading_ottoman, "OttomanDiscBase", Vector3(0.0, 0.12, 0.0), 0.26, 0.32, 0.07, charcoal)
	_cylinder(reading_ottoman, "OttomanStem", Vector3(0.0, 0.25, 0.0), 0.045, 0.060, 0.24, champagne)
	_sphere(reading_ottoman, "OttomanUnderShell", Vector3(0.0, 0.40, 0.0), Vector3(0.40, 0.13, 0.31), walnut)
	_sphere(reading_ottoman, "OttomanCushion", Vector3(0.0, 0.49, -0.02), Vector3(0.37, 0.14, 0.29), cream)
	for tuft_x in [-0.16, 0.0, 0.16]:
		_sphere(reading_ottoman, "OttomanTuft", Vector3(tuft_x, 0.625, -0.02), Vector3(0.022, 0.010, 0.022), champagne)
	_add_collision_box(reading_ottoman, "OttomanCollision", Vector3(0.0, 0.38, 0.0), Vector3(0.82, 0.76, 0.65))


	# A brass floor telescope gives the window promenade a close-range focal
	# object. Tripod, geared mount, tapered optical tube, focus knobs, eyepiece,
	# rolled lens hood and real glass objective are all separate geometry.
	var telescope := Node3D.new()
	telescope.name = "DetailedHarbourFloorTelescope"
	telescope.position = Vector3(10.15, 0.0, 12.28)
	telescope.rotation_degrees.y = -8.0
	root.add_child(telescope)
	_cylinder(telescope, "TelescopeTripodHub", Vector3(0.0, 1.02, 0.0), 0.15, 0.18, 0.18, champagne)
	_cylinder(telescope, "TelescopeAzimuthPost", Vector3(0.0, 1.25, 0.0), 0.055, 0.080, 0.34, charcoal)
	for leg_data in [
		[Vector3(-0.26, 0.54, 0.04), Vector3(0.0, 0.0, -19.0)],
		[Vector3(0.26, 0.54, 0.04), Vector3(0.0, 0.0, 19.0)],
		[Vector3(0.0, 0.54, -0.24), Vector3(-19.0, 0.0, 0.0)]
	]:
		var tripod_position: Vector3 = leg_data[0]
		var tripod_rotation: Vector3 = leg_data[1]
		var telescope_leg := _cylinder(telescope, "TelescopeTripodLeg", tripod_position, 0.030, 0.046, 1.10, champagne)
		telescope_leg.rotation_degrees = tripod_rotation
		_sphere(telescope, "TelescopeTripodFoot", Vector3(tripod_position.x * 1.72, 0.045, tripod_position.z * 1.72), Vector3(0.10, 0.035, 0.10), charcoal)
	_sphere(telescope, "TelescopeDeclinationHousing", Vector3(0.0, 1.49, 0.0), Vector3(0.18, 0.16, 0.18), charcoal)
	_cylinder(telescope, "TelescopeDeclinationAxis", Vector3(0.0, 1.49, 0.0), 0.045, 0.58, champagne, Vector3(0.0, 0.0, 90.0))
	for focus_side in [-1.0, 1.0]:
		_cylinder(telescope, "TelescopeFocusKnob", Vector3(focus_side * 0.23, 1.49, -0.18), 0.065, 0.055, walnut, Vector3(0.0, 0.0, 90.0))
		for grip_index in range(8):
			var grip_angle := float(grip_index) * 45.0
			var grip_radians := deg_to_rad(grip_angle)
			_sphere(telescope, "TelescopeFocusKnurl", Vector3(focus_side * 0.26, 1.49 + cos(grip_radians) * 0.055, -0.18 + sin(grip_radians) * 0.055), Vector3(0.012, 0.012, 0.012), champagne)

	var optical_tube := _cylinder(telescope, "TelescopeOpticalTube", Vector3(0.0, 1.62, 0.08), 0.13, 0.16, 1.40, champagne, Vector3(80.0, 0.0, 0.0))
	_sphere(telescope, "TelescopeTubeBodyHighlight", Vector3(0.0, 1.62, 0.08), Vector3(0.145, 0.18, 0.58), champagne)
	for ring_z in [-0.42, 0.05, 0.49]:
		var tube_ring := MeshInstance3D.new()
		tube_ring.name = "TelescopeTubeRing"
		var tube_ring_mesh := TorusMesh.new()
		tube_ring_mesh.inner_radius = 0.132
		tube_ring_mesh.outer_radius = 0.158
		tube_ring_mesh.rings = 36
		tube_ring_mesh.ring_segments = 10
		tube_ring_mesh.material = charcoal
		tube_ring.mesh = tube_ring_mesh
		tube_ring.position = Vector3(0.0, 1.62 + ring_z * 0.17, 0.08 + ring_z)
		tube_ring.rotation_degrees.x = 90.0
		telescope.add_child(tube_ring)
	_cylinder(telescope, "TelescopeLensHood", Vector3(0.0, 1.74, 0.72), 0.17, 0.28, charcoal, Vector3(90.0, 0.0, 0.0))
	var objective_rim := MeshInstance3D.new()
	objective_rim.name = "TelescopeObjectiveRim"
	var objective_rim_mesh := TorusMesh.new()
	objective_rim_mesh.inner_radius = 0.135
	objective_rim_mesh.outer_radius = 0.168
	objective_rim_mesh.rings = 40
	objective_rim_mesh.ring_segments = 10
	objective_rim_mesh.material = champagne
	objective_rim.mesh = objective_rim_mesh
	objective_rim.position = Vector3(0.0, 1.77, 0.86)
	objective_rim.rotation_degrees.x = 90.0
	telescope.add_child(objective_rim)
	_sphere(telescope, "TelescopeObjectiveGlass", Vector3(0.0, 1.77, 0.865), Vector3(0.132, 0.132, 0.025), crystal)
	_cylinder(telescope, "TelescopeEyepieceBarrel", Vector3(0.0, 1.51, -0.68), 0.075, 0.26, charcoal, Vector3(90.0, 0.0, 0.0))
	_sphere(telescope, "TelescopeEyecup", Vector3(0.0, 1.48, -0.83), Vector3(0.095, 0.070, 0.055), walnut)
	_box(telescope, "TelescopeMakerPlate", Vector3(0.0, 1.49, -0.02), Vector3(0.12, 0.045, 0.012), cream)
	_add_collision_box(telescope, "TelescopeCollision", Vector3(0.0, 0.78, 0.0), Vector3(0.95, 1.56, 0.95))


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
	# Layered ceramic planter with rolled rim, visible soil and a tapered trunk.
	_cylinder(parent, "PlanterFoot", origin + Vector3(0.0, 0.08, 0.0) * scale_factor, 0.20 * scale_factor, 0.23 * scale_factor, 0.10 * scale_factor, champagne)
	_cylinder(parent, "Planter", origin + Vector3(0.0, 0.32, 0.0) * scale_factor, 0.30 * scale_factor, 0.24 * scale_factor, 0.52 * scale_factor, ceramic)
	_cylinder(parent, "PlanterSoil", origin + Vector3(0.0, 0.585, 0.0) * scale_factor, 0.245 * scale_factor, 0.245 * scale_factor, 0.025 * scale_factor, charcoal)
	var planter_rim := MeshInstance3D.new()
	planter_rim.name = "PlanterRolledRim"
	var planter_rim_mesh := TorusMesh.new()
	planter_rim_mesh.inner_radius = 0.255 * scale_factor
	planter_rim_mesh.outer_radius = 0.305 * scale_factor
	planter_rim_mesh.rings = 40
	planter_rim_mesh.ring_segments = 10
	planter_rim_mesh.material = champagne
	planter_rim.mesh = planter_rim_mesh
	planter_rim.position = origin + Vector3(0.0, 0.60, 0.0) * scale_factor
	parent.add_child(planter_rim)

	_cylinder(parent, "PlantTrunk", origin + Vector3(0.0, 1.02, 0.0) * scale_factor, 0.026 * scale_factor, 0.045 * scale_factor, 0.88 * scale_factor, leaf_dark)
	# Four angled branches give the canopy true depth instead of a single pole.
	for branch_data in [
		[Vector3(-0.10, 1.12, 0.02), Vector3(0.0, 0.0, -34.0), 0.42],
		[Vector3(0.10, 1.28, -0.04), Vector3(12.0, 0.0, 31.0), 0.38],
		[Vector3(-0.06, 1.46, 0.08), Vector3(-18.0, 0.0, -27.0), 0.34],
		[Vector3(0.05, 1.61, -0.03), Vector3(10.0, 0.0, 21.0), 0.28]
	]:
		var branch_position: Vector3 = branch_data[0]
		var branch_rotation: Vector3 = branch_data[1]
		var branch_height: float = branch_data[2]
		var branch := _cylinder(parent, "PlantBranch", origin + branch_position * scale_factor, 0.012 * scale_factor, 0.020 * scale_factor, branch_height * scale_factor, leaf_dark)
		branch.rotation_degrees = branch_rotation

	# Alternating leaves fan toward and away from the glazing. A separate midrib
	# catches highlights and makes each blade legible at close range.
	var leaves := [
		[Vector3(-0.30, 0.96, 0.08), Vector3(0.36, 0.065, 0.17), Vector3(10, -12, -22)],
		[Vector3(0.28, 1.08, -0.14), Vector3(0.34, 0.060, 0.16), Vector3(-8, 18, 26)],
		[Vector3(-0.36, 1.22, -0.10), Vector3(0.32, 0.058, 0.15), Vector3(-12, 24, -28)],
		[Vector3(0.34, 1.34, 0.12), Vector3(0.31, 0.055, 0.15), Vector3(14, -20, 31)],
		[Vector3(-0.27, 1.46, 0.16), Vector3(0.29, 0.052, 0.14), Vector3(18, -30, -18)],
		[Vector3(0.25, 1.56, -0.16), Vector3(0.28, 0.050, 0.13), Vector3(-16, 28, 22)],
		[Vector3(-0.20, 1.68, -0.08), Vector3(0.25, 0.045, 0.12), Vector3(-10, 18, -15)],
		[Vector3(0.18, 1.77, 0.10), Vector3(0.24, 0.043, 0.11), Vector3(12, -18, 19)],
		[Vector3(-0.10, 1.86, 0.02), Vector3(0.21, 0.040, 0.10), Vector3(6, 6, -8)]
	]
	for index in range(leaves.size()):
		var data: Array = leaves[index]
		var leaf_position: Vector3 = data[0]
		var leaf_scale: Vector3 = data[1]
		var leaf_rotation: Vector3 = data[2]
		var leaf := _sphere(parent, "PlantLeaf", origin + leaf_position * scale_factor, leaf_scale * scale_factor, leaf_dark if index % 2 == 0 else leaf_light)
		leaf.rotation_degrees = leaf_rotation
		var midrib := _box(parent, "PlantLeafMidrib", origin + (leaf_position + Vector3(0.0, -0.012, 0.0)) * scale_factor, Vector3(leaf_scale.x * 1.35, 0.008, 0.010) * scale_factor, champagne)
		midrib.rotation_degrees = leaf_rotation


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
