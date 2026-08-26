class_name ApartmentBuilder
extends Node3D

const CEILING_HEIGHT := 3.25
const WALL_THICKNESS := 0.16
const HERO_MODEL_ROOT := "res://assets/models/"

var wall_material: ShaderMaterial
var floor_material: ShaderMaterial
var warm_wood_material: ShaderMaterial
var pale_stone_material: ShaderMaterial
var dark_metal_material: StandardMaterial3D
var glass_material: ShaderMaterial
var appliance_material: StandardMaterial3D
var warm_light_material: StandardMaterial3D
var water_material: StandardMaterial3D
var harbour_boats: Array[Node3D] = []
var harbour_birds: Array[Node3D] = []
var harbour_motion_time := 0.0


func _ready() -> void:
	_create_materials()
	_build_shell()
	_build_architectural_finish()
	_build_entry_corridor()
	_build_windows()
	_build_distant_city_view()
	_build_doors()
	_build_lighting()
	_build_ceiling_services()
	_build_master_suite_assets()
	_build_kitchen()
	_build_study_rig()
	_build_sofa_interaction()
	_register_food_and_recipes()


func _process(delta: float) -> void:
	# Subtle independent boat travel and hull motion make the coastal view
	# spatially legible through the glazing instead of behaving like a backdrop.
	harbour_motion_time += delta
	for boat in harbour_boats:
		var speed := float(boat.get_meta("harbour_speed", 1.0))
		var phase := float(boat.get_meta("harbour_phase", 0.0))
		var base_y := float(boat.get_meta("harbour_base_y", boat.position.y))
		boat.position.x += speed * delta
		if boat.position.x > 72.0:
			boat.position.x = -72.0
		boat.position.y = base_y + sin(harbour_motion_time * 1.35 + phase) * 0.055
		boat.rotation_degrees.z = sin(harbour_motion_time * 1.10 + phase) * 0.75
	for bird in harbour_birds:
		var bird_speed := float(bird.get_meta("flight_speed", 2.0))
		var bird_phase := float(bird.get_meta("flight_phase", 0.0))
		var bird_base_y := float(bird.get_meta("flight_base_y", bird.position.y))
		bird.position.x -= bird_speed * delta
		if bird.position.x < -62.0:
			bird.position.x = 62.0
		bird.position.y = bird_base_y + sin(harbour_motion_time * 0.72 + bird_phase) * 0.32
		var flap := sin(harbour_motion_time * 4.2 + bird_phase) * 18.0
		var left_wing := bird.get_node_or_null("LeftWing") as Node3D
		var right_wing := bird.get_node_or_null("RightWing") as Node3D
		if left_wing:
			left_wing.rotation_degrees.x = flap
		if right_wing:
			right_wing.rotation_degrees.x = -flap


func _create_materials() -> void:
	wall_material = _create_plaster_material()
	floor_material = _create_plank_floor_material()
	warm_wood_material = _create_walnut_material()
	pale_stone_material = _create_limestone_material()
	dark_metal_material = _material(Color("292825"), 0.22, 0.72)
	appliance_material = _material(Color("b9b8b3"), 0.2, 0.8)
	warm_light_material = _material(Color("ffcf91"), 0.28)
	warm_light_material.emission_enabled = true
	warm_light_material.emission = Color("ffd9a5")
	warm_light_material.emission_energy_multiplier = 2.8
	water_material = _material(Color(0.34, 0.68, 0.86, 0.64), 0.12)
	water_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	glass_material = _create_architectural_glass_material()


func _build_shell() -> void:
	# 36 m x 28 m great-room apartment. Windows face the high-rise ocean view (+Z).
	_box(self, "Floor", Vector3(0.0, -0.09, 0.0), Vector3(36.0, 0.18, 28.0), floor_material, true)
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


func _create_architectural_glass_material() -> ShaderMaterial:
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
render_mode blend_mix, depth_draw_alpha_prepass, cull_disabled, diffuse_burley, specular_schlick_ggx;

varying vec3 world_position;

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float facing = clamp(dot(normalize(NORMAL), normalize(VIEW)), 0.0, 1.0);
	float fresnel = pow(1.0 - facing, 2.75);
	float sky_band = sin(world_position.y * 1.65 + world_position.x * 0.11 + world_position.z * 0.07) * 0.5 + 0.5;
	float vertical_fade = smoothstep(0.0, 3.3, world_position.y);
	vec3 clear_tint = vec3(0.10, 0.19, 0.23);
	vec3 reflected_sky = vec3(0.48, 0.67, 0.76);
	vec3 color = mix(clear_tint, reflected_sky, fresnel * 0.74 + sky_band * vertical_fade * 0.09);
	ALBEDO = color;
	ALPHA = clamp(0.055 + fresnel * 0.30 + sky_band * 0.025, 0.05, 0.38);
	ROUGHNESS = mix(0.095, 0.035, fresnel);
	METALLIC = 0.0;
	SPECULAR = 1.0;
}
"""
	var material := ShaderMaterial.new()
	material.shader = shader
	return material


func _create_walnut_material() -> ShaderMaterial:
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

varying vec3 world_position;

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float grain_axis = world_position.y * 0.82 + world_position.x * 0.14 + world_position.z * 0.09;
	float broad_grain = sin(grain_axis * 24.0 + sin(world_position.x * 2.7 + world_position.z * 2.1) * 2.6) * 0.5 + 0.5;
	float fine_grain = sin(grain_axis * 142.0 + sin(world_position.x * 8.0 - world_position.z * 5.0) * 0.75) * 0.5 + 0.5;
	float pore = sin((world_position.x + world_position.z) * 93.0 + world_position.y * 37.0) * 0.5 + 0.5;
	float grain = broad_grain * 0.52 + fine_grain * 0.34 + pore * 0.14;
	vec3 dark_walnut = vec3(0.225, 0.120, 0.070);
	vec3 honey_walnut = vec3(0.425, 0.255, 0.145);
	ALBEDO = mix(dark_walnut, honey_walnut, grain);
	ROUGHNESS = mix(0.40, 0.56, fine_grain * 0.62 + pore * 0.38);
	SPECULAR = 0.34;
}
"""
	var material := ShaderMaterial.new()
	material.shader = shader
	return material


func _create_plaster_material() -> ShaderMaterial:
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

varying vec3 world_position;

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float fine_grain = sin(world_position.x * 63.0 + world_position.y * 47.0 + world_position.z * 57.0) * 0.5 + 0.5;
	float cross_grain = sin(world_position.x * 29.0 - world_position.y * 71.0 + world_position.z * 31.0) * 0.5 + 0.5;
	float cloud = sin(world_position.x * 1.8 + sin(world_position.y * 1.35) * 1.7 + world_position.z * 1.15) * 0.5 + 0.5;
	float texture_value = fine_grain * 0.45 + cross_grain * 0.25 + cloud * 0.30;
	vec3 warm_plaster = vec3(0.806, 0.770, 0.710);
	ALBEDO = warm_plaster * mix(0.955, 1.035, texture_value);
	ROUGHNESS = mix(0.76, 0.88, fine_grain * 0.55 + cross_grain * 0.45);
	SPECULAR = 0.24;
}
"""
	var material := ShaderMaterial.new()
	material.shader = shader
	return material


func _create_limestone_material() -> ShaderMaterial:
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

varying vec3 world_position;

float stone_hash(vec3 point) {
	return fract(sin(dot(point, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float broad = sin(world_position.x * 0.72 + sin(world_position.z * 0.46) * 2.2 + world_position.y * 1.35);
	float secondary = sin(world_position.z * 1.18 - world_position.x * 0.31 + sin(world_position.y * 2.1));
	float primary_vein = smoothstep(0.86, 0.975, abs(broad));
	float hairline = smoothstep(0.925, 0.99, abs(secondary));
	float mineral = stone_hash(floor(world_position * 9.0));
	vec3 limestone = vec3(0.730, 0.700, 0.650);
	vec3 vein_color = vec3(0.455, 0.425, 0.385);
	vec3 color = limestone * mix(0.955, 1.045, mineral);
	color = mix(color, vein_color, primary_vein * 0.24 + hairline * 0.12);
	ALBEDO = color;
	ROUGHNESS = mix(0.29, 0.39, mineral * 0.55 + primary_vein * 0.30);
	SPECULAR = 0.48;
}
"""
	var material := ShaderMaterial.new()
	material.shader = shader
	return material


func _create_plank_floor_material() -> ShaderMaterial:
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

float hash(vec2 point) {
	return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
}

void fragment() {
	vec2 board_grid = UV * vec2(18.0, 34.0);
	float row = floor(board_grid.y);
	board_grid.x += mod(row, 2.0) * 0.5;
	vec2 board_uv = fract(board_grid);
	float edge_distance = min(min(board_uv.x, 1.0 - board_uv.x), min(board_uv.y, 1.0 - board_uv.y));
	float joint = smoothstep(0.025, 0.055, edge_distance);
	float board_tone = hash(floor(board_grid));
	float grain = sin((UV.x * 110.0 + UV.y * 7.0) + sin(UV.y * 73.0) * 1.8) * 0.5 + 0.5;
	vec3 walnut_dark = vec3(0.235, 0.125, 0.070);
	vec3 walnut_light = vec3(0.405, 0.245, 0.145);
	vec3 wood = mix(walnut_dark, walnut_light, board_tone * 0.58 + grain * 0.20);
	ALBEDO = mix(wood * 0.36, wood, joint);
	ROUGHNESS = mix(0.34, 0.55, grain * 0.42);
	SPECULAR = 0.36;
}
"""
	var material := ShaderMaterial.new()
	material.shader = shader
	return material


func _build_architectural_finish() -> void:
	# Fine architectural layers keep the shell from reading as a set of raw boxes.
	var skirting := _material(Color("6a4a35"), 0.46)
	var shadow_gap := _material(Color("232220"), 0.34, 0.35)
	var brass_inlay := _material(Color("a98555"), 0.24, 0.76)

	# Solid-wall skirting follows the apartment perimeter and the two principal
	# partitions. The glazing remains clean, with its own sill detail.
	var skirting_runs := [
		[Vector3(-3.8, 0.075, -13.87), Vector3(28.4, 0.15, 0.055)],
		[Vector3(15.0, 0.075, -13.87), Vector3(6.0, 0.15, 0.055)],
		[Vector3(-17.87, 0.075, -10.0), Vector3(0.055, 0.15, 8.0)],
		[Vector3(-17.87, 0.075, 8.3), Vector3(0.055, 0.15, 11.4)],
		[Vector3(17.87, 0.075, 0.0), Vector3(0.055, 0.15, 28.0)],
		[Vector3(10.87, 0.075, 5.0), Vector3(0.055, 0.15, 18.0)],
		[Vector3(-4.87, 0.075, 0.8), Vector3(0.055, 0.15, 10.4)],
		[Vector3(-4.87, 0.075, 10.8), Vector3(0.055, 0.15, 6.4)]
	]
	for run in skirting_runs:
		_box(self, "TimberSkirting", run[0], run[1], skirting, false)

	# A recessed ceiling shadow line and warm inner cove give the open living
	# space a layered ceiling without lowering the perceived height.
	for data in [
		[Vector3(0.0, CEILING_HEIGHT - 0.035, -13.72), Vector3(35.4, 0.035, 0.045)],
		[Vector3(-17.72, CEILING_HEIGHT - 0.035, 0.0), Vector3(0.045, 0.035, 27.4)],
		[Vector3(17.72, CEILING_HEIGHT - 0.035, 0.0), Vector3(0.045, 0.035, 27.4)]
	]:
		_box(self, "CeilingShadowGap", data[0], data[1], shadow_gap, false)
	for data in [
		[Vector3(3.0, CEILING_HEIGHT - 0.055, 10.9), Vector3(15.8, 0.028, 0.055)],
		[Vector3(-4.9, CEILING_HEIGHT - 0.055, 5.2), Vector3(0.055, 0.028, 11.4)],
		[Vector3(10.9, CEILING_HEIGHT - 0.055, 5.2), Vector3(0.055, 0.028, 11.4)]
	]:
		_box(self, "LivingCoveGlow", data[0], data[1], warm_light_material, false)

	# Flush metal inlay outlines the stone foyer transition instead of ending
	# the material with a hard, game-like rectangle.
	_box(self, "FoyerInlayNorth", Vector3(11.8, 0.042, -8.56), Vector3(12.25, 0.018, 0.035), brass_inlay, false)
	_box(self, "FoyerInlaySouth", Vector3(11.8, 0.042, -13.94), Vector3(12.25, 0.018, 0.035), brass_inlay, false)
	_box(self, "FoyerInlayWest", Vector3(5.68, 0.042, -11.25), Vector3(0.035, 0.018, 5.35), brass_inlay, false)


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
		_box(lobby, "ElevatorThreshold", Vector3(x, 0.025, -19.98), Vector3(1.88, 0.025, 0.22), brushed_metal, false)
		_box(lobby, "ElevatorFloorDisplay", Vector3(x, 2.86, -19.995), Vector3(0.52, 0.075, 0.025), warm_light_material, false)

	# Large-format stone modules, flush brass inlay and detailed control hardware
	# keep the private lift lobby consistent with the apartment finish.
	var lobby_joint := _material(Color("5e5a53"), 0.58)
	var lobby_brass := _material(Color("a68254"), 0.20, 0.80)
	for x in [7.65, 9.10, 10.55, 12.0, 13.45]:
		_box(lobby, "LobbyFloorJoint", Vector3(x, 0.006, -17.15), Vector3(0.022, 0.012, 5.85), lobby_joint, false)
	for z in [-19.35, -18.25, -17.15, -16.05, -14.95]:
		_box(lobby, "LobbyFloorJoint", Vector3(10.55, 0.007, z), Vector3(8.35, 0.012, 0.022), lobby_joint, false)
	_box(lobby, "LobbyBrassAxis", Vector3(10.55, 0.018, -17.15), Vector3(0.035, 0.014, 5.92), lobby_brass, false)

	# Shadow-gapped wall panels and a restrained luminous ceiling slot add depth
	# to the long corridor without reducing its clear width.
	for z in [-19.20, -17.70, -16.20, -14.70]:
		_box(lobby, "LobbyLeftPanelReveal", Vector3(6.305, 1.62, z), Vector3(0.025, 2.82, 0.035), dark_metal_material, false)
		_box(lobby, "LobbyRightPanelReveal", Vector3(14.795, 1.62, z), Vector3(0.025, 2.82, 0.035), dark_metal_material, false)
	_box(lobby, "LobbyLeftSkirting", Vector3(6.32, 0.075, -17.15), Vector3(0.055, 0.15, 5.96), dark_wood, false)
	_box(lobby, "LobbyRightSkirting", Vector3(14.78, 0.075, -17.15), Vector3(0.055, 0.15, 5.96), dark_wood, false)
	_box(lobby, "LobbyCeilingSlot", Vector3(10.55, CEILING_HEIGHT - 0.035, -17.15), Vector3(0.12, 0.035, 5.55), warm_light_material, false)
	_box(lobby, "LobbyCeilingSlotReveal", Vector3(10.55, CEILING_HEIGHT - 0.02, -17.15), Vector3(0.22, 0.025, 5.72), dark_metal_material, false)

	# Shared call station with a recessed screen, round button and service seam.
	_box(lobby, "ElevatorCallPanel", Vector3(10.55, 1.34, -20.015), Vector3(0.34, 0.72, 0.04), brushed_metal, false)
	_box(lobby, "ElevatorCallScreen", Vector3(10.55, 1.56, -19.985), Vector3(0.22, 0.18, 0.022), dark_metal_material, false)
	_box(lobby, "ElevatorCallScreenGlow", Vector3(10.55, 1.56, -19.969), Vector3(0.08, 0.055, 0.012), warm_light_material, false)
	var call_button := MeshInstance3D.new()
	call_button.name = "ElevatorCallButton"
	var call_mesh := CylinderMesh.new()
	call_mesh.top_radius = 0.052
	call_mesh.bottom_radius = 0.052
	call_mesh.height = 0.025
	call_mesh.radial_segments = 24
	call_mesh.material = lobby_brass
	call_button.mesh = call_mesh
	call_button.position = Vector3(10.55, 1.18, -19.975)
	call_button.rotation_degrees.x = 90.0
	lobby.add_child(call_button)

	# Slim console and artwork make the lobby read as a private residence floor.
	_box(lobby, "LobbyConsole", Vector3(6.48, 0.72, -17.45), Vector3(0.42, 1.15, 2.35), dark_wood, true)
	_box(lobby, "LobbyArtwork", Vector3(6.39, 1.95, -17.45), Vector3(0.05, 1.22, 1.55), warm_wood_material, false)

	for position in [Vector3(8.3, 3.02, -16.2), Vector3(12.8, 3.02, -16.2), Vector3(8.3, 3.02, -19.0), Vector3(12.8, 3.02, -19.0)]:
		var light := _ceiling_light("LobbyDownlight", position, 1.65, 5.2)
		light.shadow_enabled = false


func _build_windows() -> void:
	# Main living glazing, set back from the L sofa to preserve a walkable window promenade.
	# Layered aluminium caps, rubber gaskets, reveal linings and a recessed shade
	# pocket give the curtain wall actual construction depth.
	var frame_cap := _material(Color("393a38"), 0.20, 0.78)
	var gasket_material := _material(Color("111312"), 0.64, 0.08)
	var sill_material := _material(Color("b9b2a7"), 0.34)
	for x in [-3.0, 1.0, 5.0, 9.0, 13.0]:
		_box(self, "WindowPane", Vector3(x, 1.62, 13.94), Vector3(3.82, 3.05, 0.045), glass_material, false)
		_box(self, "WindowTopGasket", Vector3(x, 3.105, 13.875), Vector3(3.76, 0.025, 0.065), gasket_material, false)
		_box(self, "WindowBottomGasket", Vector3(x, 0.135, 13.875), Vector3(3.76, 0.025, 0.065), gasket_material, false)
	for x in [-5.0, -1.0, 3.0, 7.0, 11.0, 15.0]:
		_box(self, "WindowMullion", Vector3(x, 1.62, 13.91), Vector3(0.075, 3.25, 0.09), dark_metal_material, true)
		_box(self, "WindowMullionCap", Vector3(x, 1.62, 13.805), Vector3(0.115, 3.12, 0.12), frame_cap, false)
		_box(self, "WindowMullionGasket", Vector3(x, 1.62, 13.865), Vector3(0.022, 3.04, 0.035), gasket_material, false)
	_box(self, "WindowHead", Vector3(5.0, 3.18, 13.91), Vector3(20.2, 0.12, 0.09), dark_metal_material, true)
	_box(self, "WindowHeadCap", Vector3(5.0, 3.135, 13.79), Vector3(20.15, 0.10, 0.16), frame_cap, false)
	_box(self, "WindowSill", Vector3(5.0, 0.06, 13.91), Vector3(20.2, 0.12, 0.09), dark_metal_material, true)
	_box(self, "InteriorStoneSill", Vector3(5.0, 0.105, 13.66), Vector3(20.25, 0.07, 0.48), sill_material, false)
	_box(self, "LivingWindowLeftReveal", Vector3(-5.12, 1.62, 13.72), Vector3(0.18, 3.25, 0.40), wall_material, false)
	_box(self, "LivingWindowRightReveal", Vector3(15.12, 1.62, 13.72), Vector3(0.18, 3.25, 0.40), wall_material, false)
	_box(self, "LivingShadePocket", Vector3(5.0, 3.16, 13.48), Vector3(20.35, 0.13, 0.26), gasket_material, false)
	_box(self, "LivingShadeTrack", Vector3(5.0, 3.085, 13.48), Vector3(20.0, 0.025, 0.055), frame_cap, false)

	# A slim flush trench convector below the glass adds believable servicing
	# detail and breaks up the otherwise uninterrupted sill line.
	for x in [-3.0, 1.0, 5.0, 9.0, 13.0]:
		_box(self, "WindowConvectorRecess", Vector3(x, 0.045, 13.26), Vector3(3.25, 0.025, 0.32), gasket_material, false)
		for grille_x in [-1.35, -0.90, -0.45, 0.0, 0.45, 0.90, 1.35]:
			_box(self, "WindowConvectorGrille", Vector3(x + grille_x, 0.064, 13.26), Vector3(0.035, 0.018, 0.28), frame_cap, false)

	# Master bedroom has its own side window, looking along the coast.
	for z in [-8.0, -4.0, 0.0, 4.0]:
		_box(self, "BedroomWindow", Vector3(-17.94, 1.62, z), Vector3(0.045, 3.05, 3.82), glass_material, false)
		_box(self, "BedroomMullion", Vector3(-17.91, 1.62, z + 2.0), Vector3(0.09, 3.25, 0.075), dark_metal_material, true)
		_box(self, "BedroomMullionCap", Vector3(-17.80, 1.62, z + 2.0), Vector3(0.12, 3.12, 0.115), frame_cap, false)
		_box(self, "BedroomTopGasket", Vector3(-17.875, 3.105, z), Vector3(0.065, 0.025, 3.76), gasket_material, false)
		_box(self, "BedroomBottomGasket", Vector3(-17.875, 0.135, z), Vector3(0.065, 0.025, 3.76), gasket_material, false)
	_box(self, "BedroomWindowHead", Vector3(-17.80, 3.16, -2.0), Vector3(0.34, 0.13, 16.25), frame_cap, false)
	_box(self, "BedroomStoneSill", Vector3(-17.72, 0.105, -2.0), Vector3(0.48, 0.07, 16.25), sill_material, false)
	_box(self, "BedroomShadePocket", Vector3(-17.50, 3.16, -2.0), Vector3(0.26, 0.13, 16.35), gasket_material, false)

	# Bathroom glazing is translucent rather than a scenic picture.
	for x in [-16.0, -12.0, -8.0]:
		var frosted := _material(Color(0.72, 0.79, 0.8, 0.58), 0.72)
		frosted.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		frosted.cull_mode = BaseMaterial3D.CULL_DISABLED
		_box(self, "BathroomFrostedPane", Vector3(x, 1.62, 13.94), Vector3(3.82, 3.05, 0.045), frosted, false)
	for x in [-18.0, -14.0, -10.0, -6.0]:
		_box(self, "BathroomWindowMullion", Vector3(x, 1.62, 13.84), Vector3(0.11, 3.18, 0.16), frame_cap, false)
	_box(self, "BathroomWindowHead", Vector3(-12.0, 3.16, 13.84), Vector3(12.15, 0.13, 0.16), frame_cap, false)
	_box(self, "BathroomStoneSill", Vector3(-12.0, 0.105, 13.68), Vector3(12.15, 0.07, 0.44), sill_material, false)

	# Motorized privacy shades keep the home's primary views optional. They start
	# retracted, can be operated from discreet wall controls and persist state.
	var shade_material := _material(Color(0.88, 0.84, 0.76, 0.92), 0.94)
	shade_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	shade_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	_add_privacy_shade(
		"LivingPrivacyShade",
		"living_privacy_shade",
		Vector3(5.0, 1.62, 13.76),
		Vector3(20.1, 3.0, 0.035),
		Vector3(15.55, 1.18, 13.45),
		shade_material
	)
	_add_privacy_shade(
		"BedroomPrivacyShade",
		"bedroom_privacy_shade",
		Vector3(-17.76, 1.62, -2.0),
		Vector3(0.035, 3.0, 15.8),
		Vector3(-17.45, 1.18, 5.25),
		shade_material
	)


func _add_privacy_shade(
	shade_name: String,
	object_id: String,
	shade_position: Vector3,
	shade_size: Vector3,
	control_position: Vector3,
	material: Material
) -> void:
	var moving_part := Node3D.new()
	moving_part.name = "%sPanel" % shade_name
	add_child(moving_part)
	_box(moving_part, "Fabric", shade_position, shade_size, material, false)

	var control := OpenableInteractable.new()
	control.name = "%sControl" % shade_name
	control.object_id = object_id
	control.display_name = shade_name.capitalize()
	control.moving_part = moving_part
	control.motion_type = OpenableInteractable.MotionType.SLIDE
	control.open_offset = Vector3(0.0, 3.15, 0.0)
	control.open_rotation_degrees = Vector3.ZERO
	control.motion_seconds = 1.1
	control.starts_open = true
	control.open_label = "Raise privacy shade"
	control.close_label = "Lower privacy shade"
	control.position = control_position
	control.add_child(_area_shape(Vector3(0.65, 1.1, 0.65)))
	control.add_to_group("privacy_shade")
	add_child(control)


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

	# A modeled marina, promenade trees and street lamps create a readable
	# intermediate scale between the ocean and tower wall.
	var marina_deck := _material(Color("766d60"), 0.68)
	var marina_metal := _material(Color("4e565a"), 0.25, 0.62)
	var tree_trunk := _material(Color("4a3628"), 0.78)
	var tree_leaf := _material(Color("284c3e"), 0.82)
	for pier_x in [-48.0, -24.0, 0.0, 24.0, 48.0]:
		_box(city, "MarinaPier", Vector3(pier_x, -57.05, 69.8), Vector3(1.15, 0.24, 14.8), marina_deck, false)
		_box(city, "MarinaPierCap", Vector3(pier_x, -56.86, 62.5), Vector3(3.8, 0.16, 0.8), marina_deck, false)
		for finger_z in [66.0, 70.0, 74.0]:
			_box(city, "MarinaFinger", Vector3(pier_x + 2.35, -57.04, finger_z), Vector3(4.7, 0.20, 0.62), marina_deck, false)
			_box(city, "MarinaRail", Vector3(pier_x + 2.35, -56.72, finger_z + 0.34), Vector3(4.7, 0.035, 0.035), marina_metal, false)
		for yacht_data in [
			Vector3(pier_x - 2.25, -57.12, 67.8),
			Vector3(pier_x + 4.35, -57.12, 72.3)
		]:
			_ellipsoid(city, "MarinaYachtHull", yacht_data, Vector3(1.85, 0.30, 0.46), pale_stone_material)
			_ellipsoid(city, "MarinaYachtCabin", yacht_data + Vector3(-0.28, 0.48, 0.0), Vector3(0.62, 0.32, 0.34), glass_material)

	# Evenly spaced greenery and lights make the promenade read as inhabitable.
	for promenade_x in [-84.0, -66.0, -48.0, -30.0, -12.0, 6.0, 24.0, 42.0, 60.0, 78.0]:
		var trunk := MeshInstance3D.new()
		trunk.name = "PromenadeTreeTrunk"
		var trunk_mesh := CylinderMesh.new()
		trunk_mesh.top_radius = 0.20
		trunk_mesh.bottom_radius = 0.30
		trunk_mesh.height = 3.2
		trunk_mesh.radial_segments = 16
		trunk_mesh.material = tree_trunk
		trunk.mesh = trunk_mesh
		trunk.position = Vector3(promenade_x, -54.92, 78.0)
		city.add_child(trunk)
		_ellipsoid(city, "PromenadeTreeCanopy", Vector3(promenade_x, -52.80, 78.0), Vector3(1.35, 1.05, 1.05), tree_leaf)

		var lamp_post := MeshInstance3D.new()
		lamp_post.name = "PromenadeLampPost"
		var post_mesh := CylinderMesh.new()
		post_mesh.top_radius = 0.065
		post_mesh.bottom_radius = 0.085
		post_mesh.height = 3.0
		post_mesh.radial_segments = 14
		post_mesh.material = marina_metal
		lamp_post.mesh = post_mesh
		lamp_post.position = Vector3(promenade_x + 4.2, -55.05, 77.2)
		city.add_child(lamp_post)
		var lamp_globe := _ellipsoid(city, "PromenadeLampGlow", Vector3(promenade_x + 4.2, -53.46, 77.2), Vector3(0.22, 0.16, 0.22), city_glow)
		lamp_globe.add_to_group("city_night_emissive")

	# Mid- and foreground neighbours sit at genuinely different distances.
	# Their side faces, balcony slabs and roof equipment create visible parallax
	# while walking along the glazing, so the view cannot read as a flat backdrop.
	var foreground_towers := [
		Vector4(-31.0, 47.0, 15.0, 52.0),
		Vector4(-10.0, 61.0, 12.0, 69.0),
		Vector4(18.0, 43.0, 13.0, 47.0),
		Vector4(38.0, 58.0, 16.0, 73.0)
	]
	for index in range(foreground_towers.size()):
		var tower: Vector4 = foreground_towers[index]
		var tower_depth := 12.0 + float(index % 2) * 3.0
		var tower_base_y := -57.2
		var tower_center := Vector3(tower.x, tower_base_y + tower.w * 0.5, tower.y)
		var tower_material: Material = facade_materials[(index + 1) % facade_materials.size()]
		_box(city, "NeighbourTowerBody", tower_center, Vector3(tower.z, tower.w, tower_depth), tower_material, false)

		# Deep balcony plates and projecting fins catch changing light from the
		# player camera instead of presenting one uninterrupted rectangle.
		for level in range(5, int(tower.w / 3.2), 3):
			var balcony_y := tower_base_y + float(level) * 3.0
			_box(city, "NeighbourBalcony", Vector3(tower.x, balcony_y, tower.y - tower_depth * 0.5 - 0.55), Vector3(tower.z + 0.9, 0.16, 1.15), crown_mat, false)
		for side in [-1.0, 1.0]:
			_box(city, "FacadeFin", Vector3(tower.x + side * tower.z * 0.36, tower_base_y + tower.w * 0.52, tower.y - tower_depth * 0.5 - 0.30), Vector3(0.20, tower.w * 0.86, 0.72), crown_mat, false)

		# Individual window columns break the mass into readable floors at night.
		for column in [-0.30, 0.0, 0.30]:
			for floor_index in range(4, int(tower.w / 3.1), 2):
				if (floor_index + index + int((column + 0.3) * 10.0)) % 3 == 0:
					continue
				var window_x := tower.x + column * tower.z
				var window_y := tower_base_y + float(floor_index) * 3.0
				var window_panel := _box(city, "NeighbourWindow", Vector3(window_x, window_y, tower.y - tower_depth * 0.5 - 0.61), Vector3(tower.z * 0.18, 1.35, 0.06), city_glow, false)
				window_panel.add_to_group("city_night_emissive")

		# Rooftop setbacks, plant rooms and antenna masts silhouette each tower.
		_box(city, "RoofSetback", Vector3(tower.x, tower_base_y + tower.w + 0.75, tower.y), Vector3(tower.z * 0.68, 1.5, tower_depth * 0.70), crown_mat, false)
		_box(city, "RoofPlantRoom", Vector3(tower.x - tower.z * 0.15, tower_base_y + tower.w + 2.15, tower.y), Vector3(tower.z * 0.26, 1.3, tower_depth * 0.28), facade_stone, false)
		_box(city, "RoofAntenna", Vector3(tower.x + tower.z * 0.16, tower_base_y + tower.w + 4.2, tower.y), Vector3(0.12, 5.0, 0.12), dark_metal_material, false)

	# Small moving-scale cues are modeled as geometry on the water. Even while
	# static, their separated distances strengthen perspective through the glass.
	var boat_material := _material(Color("e7e0d2"), 0.48)
	var wake_material := _material(Color(0.72, 0.84, 0.88, 0.48), 0.18)
	wake_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	var moving_boat_data := [
		Vector4(-24.0, -57.55, 70.0, 0.72),
		Vector4(9.0, -57.55, 87.0, 0.46),
		Vector4(47.0, -57.55, 73.0, 0.60)
	]
	for index in range(moving_boat_data.size()):
		var boat_data: Vector4 = moving_boat_data[index]
		var boat := Node3D.new()
		boat.name = "MovingHarbourBoat"
		boat.position = Vector3(boat_data.x, boat_data.y, boat_data.z)
		boat.set_meta("harbour_speed", boat_data.w)
		boat.set_meta("harbour_phase", float(index) * 2.15)
		boat.set_meta("harbour_base_y", boat_data.y)
		city.add_child(boat)
		_ellipsoid(boat, "HarbourBoatHull", Vector3.ZERO, Vector3(1.30, 0.275, 0.36), boat_material)
		_ellipsoid(boat, "HarbourBoatCabin", Vector3(-0.28, 0.54, 0.0), Vector3(0.48, 0.27, 0.28), glass_material)
		_box(boat, "HarbourWake", Vector3(2.6, -0.18, 0.0), Vector3(3.8, 0.025, 0.42), wake_material, false)
		harbour_boats.append(boat)

	# Small modeled gulls cross at nearer depths. Their independent flight arcs
	# and wing beats add another moving parallax layer above the marina.
	var bird_material := _material(Color("ddd9cf"), 0.62)
	var bird_beak := _material(Color("c39452"), 0.54)
	var flight_data := [
		Vector4(-38.0, 5.0, 42.0, 2.10),
		Vector4(16.0, 7.2, 55.0, 1.65),
		Vector4(48.0, 3.4, 36.0, 2.55)
	]
	for index in range(flight_data.size()):
		var data: Vector4 = flight_data[index]
		var bird := Node3D.new()
		bird.name = "FlyingHarbourGull"
		bird.position = Vector3(data.x, data.y, data.z)
		bird.set_meta("flight_speed", data.w)
		bird.set_meta("flight_phase", float(index) * 1.9)
		bird.set_meta("flight_base_y", data.y)
		city.add_child(bird)
		_ellipsoid(bird, "GullBody", Vector3.ZERO, Vector3(0.24, 0.075, 0.07), bird_material)
		_ellipsoid(bird, "GullHead", Vector3(-0.21, 0.04, 0.0), Vector3(0.075, 0.065, 0.065), bird_material)
		_ellipsoid(bird, "GullBeak", Vector3(-0.30, 0.035, 0.0), Vector3(0.08, 0.025, 0.025), bird_beak)
		var left_wing := Node3D.new()
		left_wing.name = "LeftWing"
		bird.add_child(left_wing)
		_ellipsoid(left_wing, "FeatheredWing", Vector3(0.02, 0.0, -0.19), Vector3(0.13, 0.025, 0.25), bird_material)
		var right_wing := Node3D.new()
		right_wing.name = "RightWing"
		bird.add_child(right_wing)
		_ellipsoid(right_wing, "FeatheredWing", Vector3(0.02, 0.0, 0.19), Vector3(0.13, 0.025, 0.25), bird_material)
		harbour_birds.append(bird)


func _build_doors() -> void:
	_create_hinged_door("EntranceDoor", Vector3(10.4, 0.0, -13.9), 1.45, 0.0, -92.0, true)
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
	var bedroom_lights: Array[Light3D] = []
	for position in [Vector3(-14.2, 3.02, -6.4), Vector3(-8.6, 3.02, -6.4), Vector3(-14.2, 3.02, -1.3), Vector3(-8.6, 3.02, -1.3)]:
		bedroom_lights.append(_ceiling_light("BedroomDownlight", position, 1.85, 7.0))
	var dressing_lights: Array[Light3D] = []
	for position in [Vector3(-14.0, 3.02, 3.4), Vector3(-9.0, 3.02, 3.4)]:
		dressing_lights.append(_ceiling_light("DressingDownlight", position, 1.75, 6.0))
	var bathroom_lights: Array[Light3D] = []
	for position in [Vector3(-15.0, 3.02, 10.7), Vector3(-11.2, 3.02, 10.7), Vector3(-7.6, 3.02, 11.7)]:
		bathroom_lights.append(_ceiling_light("BathroomDownlight", position, 1.65, 5.5))
	_add_light_switch("living_lights", Vector3(7.2, 1.18, -8.36), living_lights)
	_add_light_switch("kitchen_lights", Vector3(5.7, 1.18, -8.36), kitchen_lights)
	_add_light_switch("study_lights", Vector3(11.12, 1.18, -7.3), study_lights)
	_add_light_switch("bedroom_lights", Vector3(-5.12, 1.18, 5.15), bedroom_lights)
	_add_light_switch("dressing_lights", Vector3(-8.15, 1.18, 7.86), dressing_lights)
	_add_light_switch("bathroom_lights", Vector3(-12.85, 1.18, 8.14), bathroom_lights)


func _build_ceiling_services() -> void:
	var services := Node3D.new()
	services.name = "CeilingServiceDetails"
	add_child(services)
	var slot_material := _material(Color("252725"), 0.42, 0.38)
	var detector_material := _material(Color("dedbd3"), 0.62)
	var sprinkler_material := _material(Color("9a8e7c"), 0.28, 0.72)

	# Recessed linear supply and return slots establish believable mechanical
	# coordination across the large ceiling rather than leaving a blank plane.
	var diffuser_data := [
		[Vector3(-2.2, 3.145, 3.2), Vector3(3.2, 0.025, 0.20), true],
		[Vector3(6.2, 3.145, -5.5), Vector3(2.6, 0.025, 0.20), true],
		[Vector3(-11.5, 3.145, -5.6), Vector3(2.8, 0.025, 0.20), true],
		[Vector3(14.2, 3.145, 3.2), Vector3(0.20, 0.025, 2.5), false]
	]
	for diffuser in diffuser_data:
		var position: Vector3 = diffuser[0]
		var size: Vector3 = diffuser[1]
		var along_x: bool = diffuser[2]
		_box(services, "RecessedLinearDiffuser", position, size, slot_material, false)
		for offset in [-0.055, 0.0, 0.055]:
			var fin_position := position + (Vector3(0.0, 0.0, offset) if along_x else Vector3(offset, 0.0, 0.0))
			var fin_size := Vector3(size.x * 0.94, 0.012, 0.012) if along_x else Vector3(0.012, 0.012, size.z * 0.94)
			_box(services, "DiffuserFin", fin_position + Vector3(0.0, -0.016, 0.0), fin_size, detector_material, false)

	# Flush detectors, sprinkler escutcheons and projecting heads add the small
	# hardware normally visible between downlights in a finished residence.
	for detector_position in [
		Vector3(3.8, 3.125, 2.0),
		Vector3(-11.3, 3.125, -4.2),
		Vector3(14.1, 3.125, 4.8)
	]:
		_cylinder(services, "SmokeDetectorBody", detector_position, 0.095, 0.105, 0.045, detector_material)
		_cylinder(services, "SmokeDetectorSensorRing", detector_position + Vector3(0.0, -0.030, 0.0), 0.052, 0.052, 0.016, slot_material)
		for angle in range(0, 360, 60):
			var radians := deg_to_rad(float(angle))
			var vent_position := detector_position + Vector3(cos(radians) * 0.073, -0.030, sin(radians) * 0.073)
			_box(services, "DetectorVent", vent_position, Vector3(0.020, 0.010, 0.010), slot_material, false)

	for sprinkler_position in [
		Vector3(-4.2, 3.125, 5.6),
		Vector3(5.0, 3.125, -2.0),
		Vector3(-12.8, 3.125, 2.8),
		Vector3(-8.0, 3.125, 11.0),
		Vector3(15.4, 3.125, -1.0)
	]:
		_cylinder(services, "SprinklerEscutcheon", sprinkler_position, 0.060, 0.060, 0.022, detector_material)
		_cylinder(services, "SprinklerHead", sprinkler_position + Vector3(0.0, -0.038, 0.0), 0.018, 0.024, 0.055, sprinkler_material)
		_box(services, "SprinklerDeflector", sprinkler_position + Vector3(0.0, -0.070, 0.0), Vector3(0.075, 0.010, 0.025), sprinkler_material, false)


func _build_kitchen() -> void:
	var kitchen := Node3D.new()
	kitchen.name = "InteractiveKitchen"
	add_child(kitchen)

	# Full L-shaped kitchen run. Layered fronts, reveals and appliance niches keep
	# the cabinetry from reading as three monolithic blocks.
	var cabinet_face := _material(Color("78543b"), 0.46)
	var cabinet_reveal := _material(Color("241f1b"), 0.42, 0.18)
	var handle_material := _material(Color("9b7b55"), 0.22, 0.76)
	var backsplash_material := _material(Color("c9c2b7"), 0.38)

	_box(kitchen, "BackCabinetRun", Vector3(0.0, 0.46, -12.75), Vector3(10.6, 0.92, 0.72), warm_wood_material, true)
	_box(kitchen, "BackToeKick", Vector3(-0.45, 0.10, -12.35), Vector3(9.55, 0.18, 0.08), cabinet_reveal, false)
	_box(kitchen, "BackStoneTop", Vector3(0.0, 0.95, -12.75), Vector3(10.7, 0.08, 0.78), pale_stone_material, true)
	_box(kitchen, "BackStoneApron", Vector3(0.0, 0.90, -12.34), Vector3(10.7, 0.12, 0.035), pale_stone_material, false)
	_box(kitchen, "StoneBacksplash", Vector3(-0.45, 1.48, -13.13), Vector3(9.55, 0.96, 0.055), backsplash_material, false)

	# Individually inset base fronts with 8 mm shadow gaps and slim metal pulls.
	for x in [-4.45, -3.35, -2.25, -1.15, -0.05, 1.05, 2.15, 3.25]:
		_box(kitchen, "BaseCabinetFront", Vector3(x, 0.52, -12.365), Vector3(1.02, 0.70, 0.035), cabinet_face, false)
		_box(kitchen, "BaseCabinetTopGap", Vector3(x, 0.875, -12.383), Vector3(1.02, 0.018, 0.018), cabinet_reveal, false)
		_box(kitchen, "BaseCabinetPull", Vector3(x, 0.77, -12.395), Vector3(0.42, 0.025, 0.025), handle_material, false)

	# Shallow upper cabinets stop below the ceiling and cast a warm task-light
	# line across the stone splashback.
	for x in [-3.85, -2.55, -1.25, 0.05, 1.35, 2.65]:
		_box(kitchen, "UpperCabinetCarcass", Vector3(x, 2.24, -13.48), Vector3(1.20, 1.12, 0.48), warm_wood_material, false)
		_box(kitchen, "UpperCabinetFront", Vector3(x, 2.24, -13.225), Vector3(1.12, 1.02, 0.035), cabinet_face, false)
		_box(kitchen, "UpperCabinetSideReveal", Vector3(x + 0.59, 2.24, -13.205), Vector3(0.018, 1.04, 0.025), cabinet_reveal, false)
		_box(kitchen, "UpperCabinetPull", Vector3(x + 0.43, 1.81, -13.185), Vector3(0.025, 0.28, 0.025), handle_material, false)
	_box(kitchen, "UnderCabinetLight", Vector3(-0.60, 1.67, -13.20), Vector3(7.75, 0.025, 0.055), warm_light_material, false)

	# The perpendicular run gets the same joinery rhythm, including a true
	# recessed plinth and side-facing drawer fronts.
	_box(kitchen, "LeftCabinetRun", Vector3(-5.0, 0.46, -10.25), Vector3(0.72, 0.92, 5.7), warm_wood_material, true)
	_box(kitchen, "LeftToeKick", Vector3(-4.60, 0.10, -10.05), Vector3(0.08, 0.18, 4.95), cabinet_reveal, false)
	_box(kitchen, "LeftStoneTop", Vector3(-5.0, 0.95, -10.25), Vector3(0.78, 0.08, 5.8), pale_stone_material, true)
	_box(kitchen, "LeftStoneApron", Vector3(-4.59, 0.90, -10.25), Vector3(0.035, 0.12, 5.8), pale_stone_material, false)
	for z in [-11.65, -10.45, -9.25, -8.05]:
		_box(kitchen, "LeftCabinetFront", Vector3(-4.615, 0.52, z), Vector3(0.035, 0.70, 1.10), cabinet_face, false)
		_box(kitchen, "LeftCabinetPull", Vector3(-4.595, 0.77, z), Vector3(0.025, 0.025, 0.44), handle_material, false)

	# Waterfall stone ends, a floating shadow line and a wood service face make
	# the bar read as constructed furniture rather than a rectangular primitive.
	_box(kitchen, "BarBase", Vector3(0.25, 0.5, -6.0), Vector3(5.8, 1.0, 1.12), warm_wood_material, true)
	_box(kitchen, "BarShadowPlinth", Vector3(0.25, 0.08, -6.0), Vector3(5.15, 0.14, 0.92), cabinet_reveal, false)
	_box(kitchen, "BarStone", Vector3(0.25, 1.04, -6.0), Vector3(6.1, 0.09, 1.34), pale_stone_material, true)
	for side in [-1.0, 1.0]:
		_box(kitchen, "BarWaterfallEnd", Vector3(0.25 + side * 3.005, 0.54, -6.0), Vector3(0.09, 1.02, 1.34), pale_stone_material, false)
	_box(kitchen, "BarServiceFace", Vector3(0.25, 0.55, -5.425), Vector3(5.72, 0.78, 0.035), cabinet_face, false)
	for x in [-1.55, -0.35, 0.85, 2.05]:
		_box(kitchen, "BarFaceReveal", Vector3(x, 0.55, -5.40), Vector3(0.018, 0.76, 0.025), cabinet_reveal, false)

	for x in [-1.7, -0.4, 0.9, 2.2]:
		_add_bar_stool(kitchen, Vector3(x, 0.0, -4.95))

	_create_refrigerator(kitchen, Vector3(4.05, 0.0, -12.15))
	_create_sink(kitchen, Vector3(-2.2, 0.0, -12.55))
	_create_stove(kitchen, Vector3(1.0, 0.0, -12.55))
	_create_integrated_oven(kitchen, Vector3(2.48, 0.0, -12.34))
	_create_prep_station(kitchen, Vector3(-4.42, 0.0, -9.65))


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
	_build_bedside_tables(suite)

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
	_build_bathroom_water_interaction(suite)


func _build_bedside_tables(parent: Node3D) -> void:
	for table_data in [
		["left", Vector3(-13.45, 0.0, -7.72)],
		["right", Vector3(-9.45, 0.0, -7.72)],
	]:
		var side_key := str(table_data[0])
		var table_position: Vector3 = table_data[1]
		var table := Node3D.new()
		table.name = "%sBedsideTable" % side_key.capitalize()
		parent.add_child(table)
		_box(table, "Cabinet", table_position + Vector3(0.0, 0.34, 0.0), Vector3(0.76, 0.68, 0.66), warm_wood_material, true)
		_box(table, "StoneTop", table_position + Vector3(0.0, 0.71, 0.0), Vector3(0.82, 0.07, 0.72), pale_stone_material, true)

		var drawer_part := Node3D.new()
		drawer_part.name = "BedsideDrawer"
		table.add_child(drawer_part)
		_box(drawer_part, "DrawerFront", table_position + Vector3(0.0, 0.43, 0.345), Vector3(0.58, 0.23, 0.055), warm_wood_material, false)
		_box(drawer_part, "DrawerPull", table_position + Vector3(0.0, 0.43, 0.385), Vector3(0.22, 0.025, 0.025), dark_metal_material, false)

		var drawer := OpenableInteractable.new()
		drawer.name = "%sBedsideDrawerInteraction" % side_key.capitalize()
		drawer.object_id = "master_bedside_%s_drawer" % side_key
		drawer.moving_part = drawer_part
		drawer.motion_type = OpenableInteractable.MotionType.DRAWER
		drawer.open_offset = Vector3(0.0, 0.0, 0.36)
		drawer.open_rotation_degrees = Vector3.ZERO
		drawer.motion_seconds = 0.48
		drawer.open_label = "Open bedside drawer"
		drawer.close_label = "Close bedside drawer"
		drawer.position = table_position + Vector3(0.0, 0.46, 0.48)
		drawer.add_child(_area_shape(Vector3(0.78, 0.62, 0.65)))
		table.add_child(drawer)

		_box(table, "LampStem", table_position + Vector3(0.0, 0.96, 0.0), Vector3(0.045, 0.44, 0.045), dark_metal_material, false)
		var shade := MeshInstance3D.new()
		shade.name = "BedsideLampShade"
		var shade_mesh := CylinderMesh.new()
		shade_mesh.top_radius = 0.16
		shade_mesh.bottom_radius = 0.27
		shade_mesh.height = 0.32
		shade_mesh.radial_segments = 24
		shade_mesh.material = warm_light_material
		shade.mesh = shade_mesh
		shade.position = table_position + Vector3(0.0, 1.21, 0.0)
		table.add_child(shade)

		var lamp := OmniLight3D.new()
		lamp.name = "BedsideReadingLight"
		lamp.position = table_position + Vector3(0.0, 1.18, 0.12)
		lamp.light_color = Color("ffd09b")
		lamp.light_energy = 0.85
		lamp.omni_range = 3.6
		lamp.shadow_enabled = false
		table.add_child(lamp)

		var lamp_button_position := table_position + Vector3(0.25, 0.77, 0.18)
		_box(table, "LampButton", lamp_button_position, Vector3(0.10, 0.045, 0.10), dark_metal_material, false)
		var lamp_switch := LightSwitchInteractable.new()
		lamp_switch.name = "%sBedsideLampSwitch" % side_key.capitalize()
		lamp_switch.object_id = "master_bedside_%s_lamp" % side_key
		lamp_switch.target_lights.append(lamp)
		lamp_switch.emissive_meshes.append(shade)
		lamp_switch.position = lamp_button_position
		lamp_switch.add_child(_area_shape(Vector3(0.55, 0.45, 0.55)))
		table.add_child(lamp_switch)


func _build_bathroom_water_interaction(parent: Node3D) -> void:
	var filler := Node3D.new()
	filler.name = "BathFillerRig"
	filler.position = Vector3(-14.15, 0.0, 10.12)
	parent.add_child(filler)
	_box(filler, "BathFillerStem", Vector3(0.0, 0.82, 0.0), Vector3(0.08, 0.48, 0.08), dark_metal_material, false)
	_box(filler, "BathFillerSpout", Vector3(0.0, 1.03, 0.18), Vector3(0.08, 0.08, 0.42), dark_metal_material, false)
	_box(filler, "BathFillerHandle", Vector3(0.22, 0.82, 0.0), Vector3(0.20, 0.055, 0.055), dark_metal_material, false)

	var stream := MeshInstance3D.new()
	stream.name = "BathWaterStream"
	var stream_mesh := CylinderMesh.new()
	stream_mesh.top_radius = 0.022
	stream_mesh.bottom_radius = 0.034
	stream_mesh.height = 0.52
	stream_mesh.radial_segments = 14
	stream_mesh.material = water_material
	stream.mesh = stream_mesh
	stream.position = Vector3(0.0, 0.73, 0.39)
	stream.visible = false
	filler.add_child(stream)

	var interaction := FaucetInteractable.new()
	interaction.name = "BathFillerInteraction"
	interaction.object_id = "ensuite_bath_filler"
	interaction.water_stream = stream
	interaction.position = Vector3(0.0, 0.90, 0.18)
	interaction.add_child(_area_shape(Vector3(0.95, 1.25, 0.95)))
	filler.add_child(interaction)

	# The walk-in shower has a separate saved rainfall control. A cluster of
	# translucent streams gives clear feedback without expensive particles.
	var shower := Node3D.new()
	shower.name = "RainfallShowerRig"
	shower.position = Vector3(-7.80, 0.0, 10.90)
	parent.add_child(shower)
	_box(shower, "ShowerCeilingStem", Vector3(0.0, 2.82, 0.0), Vector3(0.08, 0.48, 0.08), dark_metal_material, false)

	var shower_head := MeshInstance3D.new()
	shower_head.name = "RainfallShowerHead"
	var head_mesh := CylinderMesh.new()
	head_mesh.top_radius = 0.38
	head_mesh.bottom_radius = 0.38
	head_mesh.height = 0.07
	head_mesh.radial_segments = 28
	head_mesh.material = dark_metal_material
	shower_head.mesh = head_mesh
	shower_head.position = Vector3(0.0, 2.56, 0.0)
	shower.add_child(shower_head)

	var rain_streams := Node3D.new()
	rain_streams.name = "RainfallWater"
	rain_streams.visible = false
	shower.add_child(rain_streams)
	for offset in [
		Vector2(-0.20, -0.20), Vector2(0.0, -0.22), Vector2(0.20, -0.20),
		Vector2(-0.22, 0.0), Vector2.ZERO, Vector2(0.22, 0.0),
		Vector2(-0.20, 0.20), Vector2(0.0, 0.22), Vector2(0.20, 0.20),
	]:
		var rain := MeshInstance3D.new()
		rain.name = "RainStream"
		var rain_mesh := CylinderMesh.new()
		rain_mesh.top_radius = 0.008
		rain_mesh.bottom_radius = 0.015
		rain_mesh.height = 1.75
		rain_mesh.radial_segments = 8
		rain_mesh.material = water_material
		rain.mesh = rain_mesh
		rain.position = Vector3(offset.x, 1.64, offset.y)
		rain_streams.add_child(rain)

	var shower_control := FaucetInteractable.new()
	shower_control.name = "RainfallShowerControl"
	shower_control.object_id = "ensuite_rainfall_shower"
	shower_control.water_stream = rain_streams
	shower_control.position = Vector3(0.72, 1.12, -0.48)
	shower_control.add_child(_area_shape(Vector3(0.72, 1.20, 0.72)))
	shower.add_child(shower_control)

	# A hinged soft-close lid adds a small but tangible bathroom interaction.
	var toilet_lid_pivot := Node3D.new()
	toilet_lid_pivot.name = "ToiletLidPivot"
	toilet_lid_pivot.position = Vector3(-9.20, 0.86, 10.78)
	parent.add_child(toilet_lid_pivot)
	var toilet_lid := MeshInstance3D.new()
	toilet_lid.name = "ToiletLid"
	var lid_mesh := CylinderMesh.new()
	lid_mesh.top_radius = 0.36
	lid_mesh.bottom_radius = 0.36
	lid_mesh.height = 0.055
	lid_mesh.radial_segments = 28
	lid_mesh.material = wall_material
	toilet_lid.mesh = lid_mesh
	toilet_lid.position = Vector3(0.0, 0.0, -0.34)
	toilet_lid.scale = Vector3(1.0, 1.0, 1.22)
	toilet_lid_pivot.add_child(toilet_lid)

	var toilet_lid_control := OpenableInteractable.new()
	toilet_lid_control.name = "ToiletLidInteraction"
	toilet_lid_control.object_id = "ensuite_toilet_lid"
	toilet_lid_control.moving_part = toilet_lid_pivot
	toilet_lid_control.motion_type = OpenableInteractable.MotionType.HINGE
	toilet_lid_control.open_rotation_degrees = Vector3(-102.0, 0.0, 0.0)
	toilet_lid_control.motion_seconds = 0.72
	toilet_lid_control.open_label = "Raise toilet lid"
	toilet_lid_control.close_label = "Lower toilet lid"
	toilet_lid_control.position = Vector3(-9.20, 0.92, 10.36)
	toilet_lid_control.add_child(_area_shape(Vector3(0.88, 0.72, 1.05)))
	parent.add_child(toilet_lid_control)


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


func _create_prep_station(parent: Node3D, origin: Vector3) -> void:
	var board := Node3D.new()
	board.name = "PreparationBoard"
	board.position = origin
	parent.add_child(board)
	_box(board, "CuttingBoard", Vector3(0.0, 1.04, 0.0), Vector3(1.05, 0.055, 0.58), warm_wood_material, false)
	_box(board, "KnifeBlade", Vector3(0.24, 1.09, 0.08), Vector3(0.52, 0.025, 0.08), appliance_material, false)
	_box(board, "KnifeHandle", Vector3(0.58, 1.09, 0.08), Vector3(0.22, 0.055, 0.11), dark_metal_material, false)

	var station := PrepStationInteractable.new()
	station.name = "PreparationCounterInteraction"
	station.object_id = "kitchen_preparation_counter"
	station.display_name = "Preparation counter"
	station.position = origin + Vector3(0.0, 1.18, 0.0)
	station.add_child(_area_shape(Vector3(1.55, 0.85, 1.05)))
	parent.add_child(station)


func _create_integrated_oven(parent: Node3D, origin: Vector3) -> void:
	var oven := Node3D.new()
	oven.name = "IntegratedWallOven"
	oven.position = origin
	parent.add_child(oven)

	var cavity_material := _material(Color("090b0c"), 0.24, 0.12)
	var enamel_material := _material(Color("171a1c"), 0.16, 0.36)
	var trim_material := _material(Color("8e9393"), 0.20, 0.82)
	var oven_glass := _material(Color(0.055, 0.075, 0.082, 0.82), 0.06, 0.16)
	oven_glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	var display_material := _material(Color("79d9d0"), 0.12)
	display_material.emission_enabled = true
	display_material.emission = Color("79d9d0")
	display_material.emission_energy_multiplier = 1.6
	var interior_glow := _material(Color("f5b56e"), 0.36)
	interior_glow.emission_enabled = true
	interior_glow.emission = Color("f5b56e")
	interior_glow.emission_energy_multiplier = 0.42

	# A deep cabinet reveal and layered metal fascia make the appliance read as
	# a fitted object instead of another flat cabinet rectangle.
	_box(oven, "CabinetShadowRecess", Vector3(0.0, 0.47, -0.015), Vector3(1.30, 0.88, 0.12), cavity_material, false)
	_box(oven, "OvenCarcass", Vector3(0.0, 0.47, 0.035), Vector3(1.22, 0.82, 0.12), appliance_material, false)
	_box(oven, "InnerCavity", Vector3(0.0, 0.42, 0.112), Vector3(1.02, 0.54, 0.075), cavity_material, false)
	_box(oven, "CavityBack", Vector3(0.0, 0.42, 0.154), Vector3(0.92, 0.45, 0.018), enamel_material, false)

	# Rack rails and trays remain visible through the smoked glass.
	for y in [0.30, 0.42, 0.54]:
		_box(oven, "RackLeftRail", Vector3(-0.39, y, 0.175), Vector3(0.025, 0.018, 0.12), trim_material, false)
		_box(oven, "RackRightRail", Vector3(0.39, y, 0.175), Vector3(0.025, 0.018, 0.12), trim_material, false)
		for x in [-0.34, -0.22, -0.10, 0.02, 0.14, 0.26, 0.34]:
			_box(oven, "RackBar", Vector3(x, y, 0.238), Vector3(0.018, 0.018, 0.17), trim_material, false)
	_box(oven, "RoastingTray", Vector3(0.0, 0.30, 0.255), Vector3(0.72, 0.035, 0.18), enamel_material, false)
	_box(oven, "InteriorLamp", Vector3(0.38, 0.58, 0.205), Vector3(0.075, 0.075, 0.018), interior_glow, false)

	# Closed door: double smoked glazing, perimeter gasket and a properly round
	# horizontal handle with separate standoffs.
	_box(oven, "DoorGasket", Vector3(0.0, 0.42, 0.205), Vector3(1.10, 0.60, 0.035), cavity_material, false)
	_box(oven, "DoorGlass", Vector3(0.0, 0.42, 0.232), Vector3(1.02, 0.52, 0.028), oven_glass, false)
	for x in [-0.48, 0.48]:
		_cylinder(oven, "HandleStandoff", Vector3(x, 0.66, 0.285), 0.028, 0.10, dark_metal_material, Vector3(90.0, 0.0, 0.0))
	_cylinder(oven, "DoorHandle", Vector3(0.0, 0.66, 0.335), 0.032, 1.08, dark_metal_material, Vector3(0.0, 0.0, 90.0))

	# The control strip carries two physical dials, a luminous clock and small
	# engraved controls rather than a featureless black band.
	_box(oven, "ControlFascia", Vector3(0.0, 0.77, 0.215), Vector3(1.12, 0.16, 0.045), enamel_material, false)
	for x in [-0.42, 0.42]:
		_cylinder(oven, "ControlKnob", Vector3(x, 0.77, 0.265), 0.062, 0.06, trim_material, Vector3(90.0, 0.0, 0.0))
		_box(oven, "KnobIndex", Vector3(x, 0.815, 0.302), Vector3(0.012, 0.025, 0.012), cavity_material, false)
	_box(oven, "DigitalDisplay", Vector3(0.0, 0.77, 0.262), Vector3(0.28, 0.072, 0.018), display_material, false)
	for x in [-0.23, -0.17, 0.17, 0.23]:
		_cylinder(oven, "TouchControl", Vector3(x, 0.77, 0.277), 0.012, 0.012, trim_material, Vector3(90.0, 0.0, 0.0))
	for x in [-0.44, -0.30, -0.16, 0.0, 0.16, 0.30, 0.44]:
		_box(oven, "LowerVentSlot", Vector3(x, 0.095, 0.242), Vector3(0.09, 0.018, 0.018), cavity_material, false)


func _create_refrigerator(parent: Node3D, origin: Vector3) -> void:
	var fridge := Node3D.new()
	fridge.name = "FrenchDoorRefrigerator"
	fridge.position = origin
	parent.add_child(fridge)

	var liner_material := _material(Color("eeeae2"), 0.34)
	var gasket_material := _material(Color("171817"), 0.48)
	var chilled_glass := _material(Color(0.72, 0.86, 0.91, 0.30), 0.1)
	chilled_glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	var produce_green := _material(Color("66875a"), 0.72)
	var bottle_amber := _material(Color("b77a3e"), 0.42)
	var bottle_clear := _material(Color(0.72, 0.88, 0.92, 0.42), 0.12)
	bottle_clear.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA

	# Built-in carcass, shadow reveals and ventilation keep the appliance from
	# reading as a single silver block between the kitchen cabinets.
	_box(fridge, "FridgeBody", Vector3(0.0, 1.12, 0.0), Vector3(1.72, 2.24, 0.82), appliance_material, true)
	_box(fridge, "InteriorLiner", Vector3(0.0, 1.32, 0.39), Vector3(1.52, 1.66, 0.12), liner_material, false)
	_box(fridge, "DarkInterior", Vector3(0.0, 1.28, 0.455), Vector3(1.42, 1.54, 0.025), gasket_material, false)
	_box(fridge, "TopShadowReveal", Vector3(0.0, 2.27, 0.17), Vector3(1.76, 0.035, 0.58), gasket_material, false)
	for x in [-0.63, -0.42, -0.21, 0.0, 0.21, 0.42, 0.63]:
		_box(fridge, "TopVentSlat", Vector3(x, 2.265, 0.48), Vector3(0.11, 0.025, 0.025), gasket_material, false)

	for y in [0.76, 1.17, 1.58]:
		_box(fridge, "GlassShelf", Vector3(0.0, y, 0.49), Vector3(1.38, 0.022, 0.55), chilled_glass, false)
		_box(fridge, "ShelfFrontTrim", Vector3(0.0, y + 0.018, 0.775), Vector3(1.42, 0.035, 0.035), appliance_material, false)
	_box(fridge, "ProduceDrawerLeft", Vector3(-0.36, 0.58, 0.59), Vector3(0.66, 0.28, 0.36), chilled_glass, false)
	_box(fridge, "ProduceDrawerRight", Vector3(0.36, 0.58, 0.59), Vector3(0.66, 0.28, 0.36), chilled_glass, false)
	_box(fridge, "ProduceDrawerLeftPull", Vector3(-0.36, 0.69, 0.79), Vector3(0.42, 0.035, 0.03), appliance_material, false)
	_box(fridge, "ProduceDrawerRightPull", Vector3(0.36, 0.69, 0.79), Vector3(0.42, 0.035, 0.03), appliance_material, false)
	for x in [-0.50, -0.34, -0.16]:
		_ellipsoid(fridge, "FreshProduce", Vector3(x, 0.83, 0.57), Vector3(0.10, 0.07, 0.09), produce_green)
	for x in [0.20, 0.38, 0.56]:
		_cylinder(fridge, "ChilledBottle", Vector3(x, 0.91, 0.57), 0.055, 0.34, bottle_clear)
		_cylinder(fridge, "BottleCap", Vector3(x, 1.09, 0.57), 0.032, 0.045, bottle_amber)

	var left_hinge := Node3D.new()
	left_hinge.name = "LeftDoorHinge"
	left_hinge.position = Vector3(-0.84, 1.38, 0.47)
	fridge.add_child(left_hinge)
	_box(left_hinge, "LeftDoor", Vector3(0.42, 0.0, 0.0), Vector3(0.82, 1.58, 0.09), appliance_material, true)
	_box(left_hinge, "LeftDoorGasket", Vector3(0.42, 0.0, -0.052), Vector3(0.74, 1.48, 0.025), gasket_material, false)
	_box(left_hinge, "LeftDoorCenterReveal", Vector3(0.825, 0.0, 0.052), Vector3(0.018, 1.50, 0.025), gasket_material, false)
	_cylinder(left_hinge, "LeftHandle", Vector3(0.72, 0.0, 0.10), 0.025, 0.88, dark_metal_material)
	_box(left_hinge, "DispenserRecess", Vector3(0.39, -0.16, 0.057), Vector3(0.34, 0.42, 0.022), gasket_material, false)
	_box(left_hinge, "DispenserTray", Vector3(0.39, -0.34, 0.095), Vector3(0.28, 0.035, 0.13), dark_metal_material, false)
	_box(left_hinge, "DispenserDisplay", Vector3(0.39, 0.09, 0.073), Vector3(0.21, 0.07, 0.015), glass_material, false)

	var right_hinge := Node3D.new()
	right_hinge.name = "RightDoorHinge"
	right_hinge.position = Vector3(0.84, 1.38, 0.47)
	fridge.add_child(right_hinge)
	_box(right_hinge, "RightDoor", Vector3(-0.42, 0.0, 0.0), Vector3(0.82, 1.58, 0.09), appliance_material, true)
	_box(right_hinge, "RightDoorGasket", Vector3(-0.42, 0.0, -0.052), Vector3(0.74, 1.48, 0.025), gasket_material, false)
	_box(right_hinge, "RightDoorCenterReveal", Vector3(-0.825, 0.0, 0.052), Vector3(0.018, 1.50, 0.025), gasket_material, false)
	_cylinder(right_hinge, "RightHandle", Vector3(-0.72, 0.0, 0.10), 0.025, 0.88, dark_metal_material)

	_box(fridge, "FreezerDrawer", Vector3(0.0, 0.34, 0.47), Vector3(1.66, 0.58, 0.09), appliance_material, true)
	_box(fridge, "FreezerDrawerReveal", Vector3(0.0, 0.63, 0.525), Vector3(1.58, 0.025, 0.025), gasket_material, false)
	_cylinder(fridge, "FreezerHandle", Vector3(0.0, 0.49, 0.59), 0.025, 1.08, dark_metal_material, Vector3(0.0, 0.0, 90.0))

	var interior_light := OmniLight3D.new()
	interior_light.name = "InteriorLight"
	interior_light.position = Vector3(0.0, 1.75, 0.58)
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

	# A lowered basin with separate rim, floor and waste reads as an inset sink
	# instead of a dark rectangle laid on top of the counter.
	_box(sink, "SinkBasinFloor", Vector3(0.0, 0.91, 0.0), Vector3(1.08, 0.035, 0.34), dark_metal_material, false)
	_box(sink, "SinkBasinFrontWall", Vector3(0.0, 0.965, 0.25), Vector3(1.20, 0.14, 0.035), dark_metal_material, false)
	_box(sink, "SinkBasinBackWall", Vector3(0.0, 0.965, -0.25), Vector3(1.20, 0.14, 0.035), dark_metal_material, false)
	_box(sink, "SinkBasinLeftWall", Vector3(-0.585, 0.965, 0.0), Vector3(0.035, 0.14, 0.48), dark_metal_material, false)
	_box(sink, "SinkBasinRightWall", Vector3(0.585, 0.965, 0.0), Vector3(0.035, 0.14, 0.48), dark_metal_material, false)
	for rim_data in [
		[Vector3(0.0, 1.035, 0.285), Vector3(1.32, 0.025, 0.055)],
		[Vector3(0.0, 1.035, -0.285), Vector3(1.32, 0.025, 0.055)],
		[Vector3(-0.635, 1.035, 0.0), Vector3(0.055, 0.025, 0.52)],
		[Vector3(0.635, 1.035, 0.0), Vector3(0.055, 0.025, 0.52)]
	]:
		_box(sink, "SinkRolledRim", rim_data[0], rim_data[1], appliance_material, false)

	var waste := MeshInstance3D.new()
	waste.name = "SinkWaste"
	var waste_mesh := CylinderMesh.new()
	waste_mesh.top_radius = 0.075
	waste_mesh.bottom_radius = 0.075
	waste_mesh.height = 0.018
	waste_mesh.radial_segments = 24
	waste_mesh.material = appliance_material
	waste.mesh = waste_mesh
	waste.position = Vector3(0.0, 0.925, 0.02)
	sink.add_child(waste)

	# Round brushed-metal riser, horizontal spout, aerator and side lever form
	# one coherent mixer rather than two box primitives.
	var faucet_stem := MeshInstance3D.new()
	faucet_stem.name = "FaucetStem"
	var stem_mesh := CylinderMesh.new()
	stem_mesh.top_radius = 0.032
	stem_mesh.bottom_radius = 0.044
	stem_mesh.height = 0.54
	stem_mesh.radial_segments = 24
	stem_mesh.material = appliance_material
	faucet_stem.mesh = stem_mesh
	faucet_stem.position = Vector3(0.0, 1.29, -0.20)
	sink.add_child(faucet_stem)

	var faucet_spout := MeshInstance3D.new()
	faucet_spout.name = "FaucetSpout"
	var spout_mesh := CylinderMesh.new()
	spout_mesh.top_radius = 0.032
	spout_mesh.bottom_radius = 0.032
	spout_mesh.height = 0.42
	spout_mesh.radial_segments = 24
	spout_mesh.material = appliance_material
	faucet_spout.mesh = spout_mesh
	faucet_spout.position = Vector3(0.0, 1.54, 0.0)
	faucet_spout.rotation_degrees.x = 90.0
	sink.add_child(faucet_spout)

	var aerator := MeshInstance3D.new()
	aerator.name = "FaucetAerator"
	var aerator_mesh := CylinderMesh.new()
	aerator_mesh.top_radius = 0.040
	aerator_mesh.bottom_radius = 0.040
	aerator_mesh.height = 0.075
	aerator_mesh.radial_segments = 20
	aerator_mesh.material = dark_metal_material
	aerator.mesh = aerator_mesh
	aerator.position = Vector3(0.0, 1.505, 0.21)
	sink.add_child(aerator)
	_box(sink, "FaucetLever", Vector3(0.12, 1.37, -0.20), Vector3(0.18, 0.025, 0.025), appliance_material, false)

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

	var hob_glass := _material(Color("101416"), 0.08, 0.08)
	var etched_ring := _material(Color("777b78"), 0.34, 0.25)
	var control_glow := _material(Color("dbe9e5"), 0.18)
	control_glow.emission_enabled = true
	control_glow.emission = Color("b9dad5")
	control_glow.emission_energy_multiplier = 1.2
	var cast_iron := _material(Color("171817"), 0.62, 0.45)

	# A layered glass slab, recessed shadow line and etched zones give the hob
	# the thin, flush-mounted construction of a real induction surface.
	_box(stove, "CooktopShadow", Vector3(0.0, 0.992, 0.0), Vector3(1.50, 0.025, 0.67), dark_metal_material, false)
	var cooktop := _box(stove, "Cooktop", Vector3(0.0, 1.018, 0.0), Vector3(1.45, 0.028, 0.62), hob_glass, false)
	_box(stove, "CooktopFrontBevel", Vector3(0.0, 1.024, 0.316), Vector3(1.40, 0.018, 0.018), appliance_material, false)
	for x in [-0.42, 0.42]:
		for z in [-0.17, 0.17]:
			var ring := MeshInstance3D.new()
			ring.name = "EtchedCookingZone"
			var ring_mesh := TorusMesh.new()
			ring_mesh.inner_radius = 0.145
			ring_mesh.outer_radius = 0.158
			ring_mesh.rings = 24
			ring_mesh.ring_segments = 10
			ring_mesh.material = etched_ring
			ring.mesh = ring_mesh
			ring.position = Vector3(x, 1.037, z)
			stove.add_child(ring)

	# Touch slider, power glyph and discrete status lamps sit beneath the glass.
	_box(stove, "TouchControlRail", Vector3(0.0, 1.041, 0.255), Vector3(0.48, 0.008, 0.018), etched_ring, false)
	for x in [-0.19, -0.095, 0.0, 0.095, 0.19]:
		_cylinder(stove, "TouchLevelDot", Vector3(x, 1.047, 0.255), 0.012, 0.006, control_glow)
	_cylinder(stove, "PowerTouchRing", Vector3(-0.58, 1.047, 0.255), 0.025, 0.006, etched_ring)
	_box(stove, "VentShadow", Vector3(0.0, 0.91, 0.33), Vector3(1.30, 0.055, 0.025), dark_metal_material, false)
	for x in [-0.52, -0.39, -0.26, -0.13, 0.0, 0.13, 0.26, 0.39, 0.52]:
		_box(stove, "VentSlot", Vector3(x, 0.91, 0.349), Vector3(0.07, 0.018, 0.012), appliance_material, false)

	# Deep, fully modeled pan storage: the drawer box, dividers and cookware
	# travel together so opening it reveals useful depth instead of a flat panel.
	var pan_drawer_part := Node3D.new()
	pan_drawer_part.name = "InductionPanDrawer"
	stove.add_child(pan_drawer_part)
	_box(pan_drawer_part, "PanDrawerBox", Vector3(0.0, 0.46, 0.05), Vector3(1.18, 0.32, 0.62), dark_metal_material, false)
	_box(pan_drawer_part, "PanDrawerFront", Vector3(0.0, 0.56, 0.34), Vector3(1.25, 0.42, 0.055), appliance_material, false)
	_box(pan_drawer_part, "PanDrawerTopReveal", Vector3(0.0, 0.785, 0.37), Vector3(1.18, 0.025, 0.025), dark_metal_material, false)
	_cylinder(pan_drawer_part, "PanDrawerPull", Vector3(0.0, 0.69, 0.405), 0.022, 0.66, dark_metal_material, Vector3(0.0, 0.0, 90.0))
	_box(pan_drawer_part, "DrawerDivider", Vector3(0.0, 0.56, 0.04), Vector3(0.035, 0.22, 0.52), appliance_material, false)
	_cylinder(pan_drawer_part, "LargeSautePan", Vector3(-0.29, 0.64, 0.06), 0.23, 0.055, cast_iron)
	_box(pan_drawer_part, "LargePanHandle", Vector3(-0.29, 0.67, 0.33), Vector3(0.10, 0.055, 0.42), cast_iron, false)
	_cylinder(pan_drawer_part, "SmallSaucepan", Vector3(0.30, 0.62, 0.03), 0.18, 0.09, cast_iron)
	_box(pan_drawer_part, "SmallPanHandle", Vector3(0.30, 0.67, 0.29), Vector3(0.08, 0.05, 0.34), cast_iron, false)

	var pan_drawer := OpenableInteractable.new()
	pan_drawer.name = "InductionPanDrawerInteraction"
	pan_drawer.object_id = "kitchen_induction_pan_drawer"
	pan_drawer.moving_part = pan_drawer_part
	pan_drawer.motion_type = OpenableInteractable.MotionType.DRAWER
	pan_drawer.open_offset = Vector3(0.0, 0.0, 0.46)
	pan_drawer.open_rotation_degrees = Vector3.ZERO
	pan_drawer.motion_seconds = 0.52
	pan_drawer.open_label = "Open pan drawer"
	pan_drawer.close_label = "Close pan drawer"
	pan_drawer.position = Vector3(0.0, 0.56, 0.50)
	pan_drawer.add_child(_area_shape(Vector3(1.55, 0.72, 0.72)))
	stove.add_child(pan_drawer)

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
	tomato_egg.required_stages = [Kitchen.STAGE_CHOPPED, Kitchen.STAGE_RAW]
	tomato_egg.appliance = "induction_stove"
	tomato_egg.cook_seconds = 6.0
	Kitchen.register_recipe(tomato_egg)
	var salmon := RecipeDefinition.new()
	salmon.id = "seared_salmon"
	salmon.display_name = "Pan-seared salmon"
	salmon.required_ingredients = ["salmon"]
	salmon.required_stages = [Kitchen.STAGE_WASHED]
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


func _create_hinged_door(id: String, hinge_position: Vector3, width: float, rotation_y: float, open_degrees: float, lockable := false) -> void:
	var frame_material := _material(Color("4a3429"), 0.40)
	var edge_material := _material(Color("2b2420"), 0.35)
	var hardware_material := _material(Color("a17e52"), 0.18, 0.82)

	# The fixed frame is separate from the moving leaf: stepped jambs, architraves
	# and a flush metal threshold give each opening a believable wall junction.
	var frame := Node3D.new()
	frame.name = "%sFrame" % id
	frame.position = hinge_position
	frame.rotation_degrees.y = rotation_y
	add_child(frame)
	_box(frame, "LeftJamb", Vector3(-0.055, 1.20, 0.0), Vector3(0.11, 2.46, 0.22), frame_material, false)
	_box(frame, "RightJamb", Vector3(width + 0.055, 1.20, 0.0), Vector3(0.11, 2.46, 0.22), frame_material, false)
	_box(frame, "HeadJamb", Vector3(width * 0.5, 2.43, 0.0), Vector3(width + 0.22, 0.11, 0.22), frame_material, false)
	for side_z in [-0.135, 0.135]:
		_box(frame, "LeftArchitrave", Vector3(-0.115, 1.20, side_z), Vector3(0.09, 2.54, 0.055), frame_material, false)
		_box(frame, "RightArchitrave", Vector3(width + 0.115, 1.20, side_z), Vector3(0.09, 2.54, 0.055), frame_material, false)
		_box(frame, "HeadArchitrave", Vector3(width * 0.5, 2.475, side_z), Vector3(width + 0.32, 0.09, 0.055), frame_material, false)
	_box(frame, "DoorThreshold", Vector3(width * 0.5, 0.025, 0.0), Vector3(width + 0.06, 0.025, 0.24), hardware_material, false)

	var hinge := Node3D.new()
	hinge.name = "%sLeaf" % id
	hinge.position = hinge_position
	hinge.rotation_degrees.y = rotation_y
	add_child(hinge)

	# A veneered core with dark edge lipping, shallow face reveals and real
	# hardware replaces the previous single rectangular slab.
	_box(hinge, "DoorPanel", Vector3(width * 0.5, 1.2, 0.0), Vector3(width, 2.4, 0.085), warm_wood_material, true)
	_box(hinge, "DoorTopEdge", Vector3(width * 0.5, 2.365, 0.0), Vector3(width - 0.06, 0.045, 0.105), edge_material, false)
	_box(hinge, "DoorBottomEdge", Vector3(width * 0.5, 0.035, 0.0), Vector3(width - 0.06, 0.045, 0.105), edge_material, false)
	_box(hinge, "DoorLatchEdge", Vector3(width - 0.025, 1.2, 0.0), Vector3(0.05, 2.30, 0.105), edge_material, false)
	for face_z in [-0.052, 0.052]:
		_box(hinge, "DoorUpperReveal", Vector3(width * 0.5, 1.78, face_z), Vector3(width - 0.24, 0.018, 0.018), edge_material, false)
		_box(hinge, "DoorLowerReveal", Vector3(width * 0.5, 0.66, face_z), Vector3(width - 0.24, 0.018, 0.018), edge_material, false)
		for flute_x in [0.28, 0.50, 0.72]:
			_box(hinge, "DoorVerticalReveal", Vector3(width * flute_x, 1.22, face_z), Vector3(0.016, 1.00, 0.018), edge_material, false)

	# Three hinge knuckles and a lever on a circular rose are modeled separately.
	for hinge_y in [0.38, 1.20, 2.02]:
		var hinge_knuckle := MeshInstance3D.new()
		hinge_knuckle.name = "DoorHingeKnuckle"
		var hinge_mesh := CylinderMesh.new()
		hinge_mesh.top_radius = 0.028
		hinge_mesh.bottom_radius = 0.028
		hinge_mesh.height = 0.18
		hinge_mesh.radial_segments = 16
		hinge_mesh.material = hardware_material
		hinge_knuckle.mesh = hinge_mesh
		hinge_knuckle.position = Vector3(0.025, hinge_y, 0.075)
		hinge.add_child(hinge_knuckle)

	var handle_rose := MeshInstance3D.new()
	handle_rose.name = "DoorHandleRose"
	var rose_mesh := CylinderMesh.new()
	rose_mesh.top_radius = 0.075
	rose_mesh.bottom_radius = 0.075
	rose_mesh.height = 0.028
	rose_mesh.radial_segments = 24
	rose_mesh.material = hardware_material
	handle_rose.mesh = rose_mesh
	handle_rose.position = Vector3(width - 0.18, 1.08, 0.075)
	handle_rose.rotation_degrees.x = 90.0
	hinge.add_child(handle_rose)
	_box(hinge, "DoorHandleSpindle", Vector3(width - 0.18, 1.08, 0.105), Vector3(0.045, 0.045, 0.15), hardware_material, false)
	_box(hinge, "DoorHandleLever", Vector3(width - 0.31, 1.08, 0.18), Vector3(0.28, 0.045, 0.045), hardware_material, false)

	if lockable:
		# The entrance leaf gets a distinct deadbolt and peephole, readable from
		# the foyer without adding UI or interaction clutter.
		var deadbolt := MeshInstance3D.new()
		deadbolt.name = "EntranceDeadbolt"
		var deadbolt_mesh := CylinderMesh.new()
		deadbolt_mesh.top_radius = 0.064
		deadbolt_mesh.bottom_radius = 0.064
		deadbolt_mesh.height = 0.032
		deadbolt_mesh.radial_segments = 24
		deadbolt_mesh.material = hardware_material
		deadbolt.mesh = deadbolt_mesh
		deadbolt.position = Vector3(width - 0.18, 1.36, 0.075)
		deadbolt.rotation_degrees.x = 90.0
		hinge.add_child(deadbolt)

		var peephole := MeshInstance3D.new()
		peephole.name = "EntrancePeephole"
		var peephole_mesh := CylinderMesh.new()
		peephole_mesh.top_radius = 0.027
		peephole_mesh.bottom_radius = 0.027
		peephole_mesh.height = 0.035
		peephole_mesh.radial_segments = 18
		peephole_mesh.material = dark_metal_material
		peephole.mesh = peephole_mesh
		peephole.position = Vector3(width * 0.50, 1.69, 0.065)
		peephole.rotation_degrees.x = 90.0
		hinge.add_child(peephole)

	var interaction := DoorInteractable.new()
	interaction.name = "%sInteraction" % id
	interaction.object_id = String(id).to_snake_case()
	interaction.door_leaf = hinge
	interaction.open_degrees = open_degrees
	interaction.lockable = lockable
	interaction.position = hinge_position + Vector3(0.0, 1.2, 0.0)
	interaction.add_child(_area_shape(Vector3(2.3, 2.5, 2.3)))
	add_child(interaction)


func _add_light_switch(id: String, position: Vector3, lights: Array[Light3D]) -> void:
	# Shadow-gap frame, flush faceplate and articulated rocker keep wall controls
	# from reading as floating rectangles.
	var switch_shadow := _material(Color("242321"), 0.48, 0.22)
	var switch_face := _material(Color("d8d1c7"), 0.36)
	_box(self, "%sShadowFrame" % id, position + Vector3(0.0, 0.0, 0.012), Vector3(0.205, 0.285, 0.025), switch_shadow, false)
	_box(self, "%sPlate" % id, position, Vector3(0.172, 0.252, 0.038), switch_face, false)
	_box(self, "%sRocker" % id, position + Vector3(0.0, 0.012, -0.026), Vector3(0.095, 0.142, 0.022), pale_stone_material, false)
	_box(self, "%sRockerTopBevel" % id, position + Vector3(0.0, 0.072, -0.040), Vector3(0.076, 0.018, 0.014), warm_light_material, false)
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

	# Recessed anti-glare downlight: a metal trim ring, dark baffle and set-back
	# luminous lens replace the former glowing square.
	var fixture := Node3D.new()
	fixture.name = "%sFixture" % id
	add_child(fixture)

	var trim_material := _material(Color("b5afa5"), 0.24, 0.70)
	var baffle_material := _material(Color("171716"), 0.42, 0.18)
	var trim := MeshInstance3D.new()
	trim.name = "DownlightTrimRing"
	var trim_mesh := TorusMesh.new()
	trim_mesh.inner_radius = 0.090
	trim_mesh.outer_radius = 0.126
	trim_mesh.rings = 24
	trim_mesh.ring_segments = 12
	trim_mesh.material = trim_material
	trim.mesh = trim_mesh
	trim.position = position + Vector3(0.0, 0.145, 0.0)
	fixture.add_child(trim)

	var baffle := MeshInstance3D.new()
	baffle.name = "DownlightBaffle"
	var baffle_mesh := CylinderMesh.new()
	baffle_mesh.top_radius = 0.094
	baffle_mesh.bottom_radius = 0.076
	baffle_mesh.height = 0.075
	baffle_mesh.radial_segments = 28
	baffle_mesh.material = baffle_material
	baffle.mesh = baffle_mesh
	baffle.position = position + Vector3(0.0, 0.118, 0.0)
	fixture.add_child(baffle)

	var lens := MeshInstance3D.new()
	lens.name = "DownlightLens"
	var lens_mesh := CylinderMesh.new()
	lens_mesh.top_radius = 0.073
	lens_mesh.bottom_radius = 0.073
	lens_mesh.height = 0.018
	lens_mesh.radial_segments = 28
	lens_mesh.material = warm_light_material
	lens.mesh = lens_mesh
	lens.position = position + Vector3(0.0, 0.078, 0.0)
	fixture.add_child(lens)
	return light


func _add_bar_stool(parent: Node3D, position: Vector3) -> void:
	var stool := Node3D.new()
	stool.name = "SculptedBarStool"
	stool.position = position
	parent.add_child(stool)
	var seat_material := _material(Color("4d4540"), 0.78)
	var piping_material := _material(Color("88745d"), 0.30, 0.70)

	# Layered oval upholstery, an embracing low back and round metalwork replace
	# the former cylinder-on-square-post construction.
	_ellipsoid(stool, "SeatUndershell", Vector3(0.0, 0.70, 0.0), Vector3(0.31, 0.075, 0.28), warm_wood_material)
	_ellipsoid(stool, "SeatCushion", Vector3(0.0, 0.77, -0.015), Vector3(0.29, 0.085, 0.26), seat_material)
	_ellipsoid(stool, "SeatFrontCrown", Vector3(0.0, 0.805, -0.18), Vector3(0.25, 0.045, 0.12), seat_material)
	_cylinder(stool, "RoundStem", Vector3(0.0, 0.38, 0.0), 0.032, 0.64, dark_metal_material)
	_cylinder(stool, "WeightedDiscBase", Vector3(0.0, 0.035, 0.0), 0.28, 0.055, dark_metal_material)

	var foot_ring := MeshInstance3D.new()
	foot_ring.name = "CircularFootrest"
	var foot_ring_mesh := TorusMesh.new()
	foot_ring_mesh.inner_radius = 0.205
	foot_ring_mesh.outer_radius = 0.225
	foot_ring_mesh.rings = 32
	foot_ring_mesh.ring_segments = 10
	foot_ring_mesh.material = piping_material
	foot_ring.mesh = foot_ring_mesh
	foot_ring.position = Vector3(0.0, 0.30, 0.0)
	stool.add_child(foot_ring)

	_cylinder(stool, "LeftBackSupport", Vector3(-0.19, 0.86, 0.19), 0.018, 0.30, piping_material)
	_cylinder(stool, "RightBackSupport", Vector3(0.19, 0.86, 0.19), 0.018, 0.30, piping_material)
	_ellipsoid(stool, "CurvedBackShell", Vector3(0.0, 1.01, 0.23), Vector3(0.32, 0.20, 0.075), warm_wood_material)
	_ellipsoid(stool, "CurvedBackCushion", Vector3(0.0, 1.01, 0.185), Vector3(0.27, 0.16, 0.075), seat_material)
	_cylinder(stool, "BackLeftPiping", Vector3(-0.27, 1.01, 0.18), 0.010, 0.25, piping_material)
	_cylinder(stool, "BackRightPiping", Vector3(0.27, 1.01, 0.18), 0.010, 0.25, piping_material)
	_collision_box(stool, "BarStoolCollision", Vector3(0.0, 0.52, 0.06), Vector3(0.62, 1.05, 0.58))


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


func _cylinder(parent: Node3D, node_name: String, position: Vector3, radius: float, height: float, material: Material, rotation_degrees_value := Vector3.ZERO) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	instance.name = node_name
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	mesh.radial_segments = 24
	mesh.rings = 2
	mesh.material = material
	instance.mesh = mesh
	instance.position = position
	instance.rotation_degrees = rotation_degrees_value
	parent.add_child(instance)
	return instance


func _ellipsoid(parent: Node3D, node_name: String, position: Vector3, shape_scale: Vector3, material: Material) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	instance.name = node_name
	var mesh := SphereMesh.new()
	mesh.radius = 1.0
	mesh.height = 2.0
	mesh.radial_segments = 28
	mesh.rings = 14
	mesh.material = material
	instance.mesh = mesh
	instance.position = position
	instance.scale = shape_scale
	parent.add_child(instance)
	return instance


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
