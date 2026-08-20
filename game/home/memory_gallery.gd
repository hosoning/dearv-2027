class_name MemoryGallery
extends Node3D

const MODEL_ROOT := "res://assets/models/"

var bronze := StandardMaterial3D.new()
var stone := StandardMaterial3D.new()
var walnut := StandardMaterial3D.new()
var velvet := StandardMaterial3D.new()
var glass := StandardMaterial3D.new()
var label_material := StandardMaterial3D.new()


func _ready() -> void:
	bronze.albedo_color = Color("7c5b36")
	bronze.roughness = 0.28
	bronze.metallic = 0.68
	stone.albedo_color = Color("d4c9b9")
	stone.roughness = 0.48
	walnut.albedo_color = Color("4e3628")
	walnut.roughness = 0.5
	velvet.albedo_color = Color("241f1c")
	velvet.roughness = 0.94
	glass.albedo_color = Color(0.69, 0.76, 0.78, 0.13)
	glass.roughness = 0.06
	glass.metallic = 0.08
	glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	glass.cull_mode = BaseMaterial3D.CULL_DISABLED
	label_material.albedo_color = Color("c7ab78")
	label_material.roughness = 0.26
	label_material.metallic = 0.52
	_build_display_zone()


func _build_display_zone() -> void:
	# A true gallery wall: walnut backdrop, floating stone console, framed vitrines and focused warm light.
	_add_box("GalleryBackdrop", Vector3(-2.85, 1.58, 6.62), Vector3(6.65, 3.05, 0.16), walnut)
	_add_collision_box("GalleryBackdropCollision", Vector3(-2.85, 1.58, 6.62), Vector3(6.65, 3.05, 0.16))
	_add_box("GalleryInset", Vector3(-2.85, 1.62, 6.51), Vector3(6.05, 2.52, 0.045), velvet)
	_add_box("MemoryConsole", Vector3(-2.85, 0.34, 6.0), Vector3(5.75, 0.68, 1.22), stone)
	_add_collision_box("MemoryConsoleCollision", Vector3(-2.85, 0.34, 6.0), Vector3(5.75, 0.68, 1.22))
	_add_box("ConsoleShadowGap", Vector3(-2.85, 0.13, 6.0), Vector3(5.28, 0.16, 0.92), velvet)
	_add_trim(Vector3(-2.85, 0.705, 6.0), Vector3(5.84, 0.045, 1.30))

	_build_vitrine("LanternVitrine", Vector3(-4.55, 1.30, 6.0), Vector3(1.72, 1.78, 1.26))
	_build_vitrine("FlowerVitrine", Vector3(-1.15, 1.30, 6.0), Vector3(1.72, 1.78, 1.26))
	_add_label_plaque(Vector3(-4.55, 0.81, 5.34), Vector3(1.04, 0.16, 0.055))
	_add_label_plaque(Vector3(-1.15, 0.81, 5.34), Vector3(1.04, 0.16, 0.055))

	_add_spot(Vector3(-4.55, 3.05, 5.38), Vector3(-4.55, 1.25, 6.0))
	_add_spot(Vector3(-1.15, 3.05, 5.38), Vector3(-1.15, 1.25, 6.0))
	_add_spot(Vector3(-2.85, 3.10, 6.05), Vector3(-2.85, 1.05, 6.15), 0.65)

	var flower := _load_model("gift_520_flower_box.glb", Vector3(-1.15, 0.88, 6.0), 0.0)
	if flower:
		var gift := AnimatedGiftInteractable.new()
		gift.name = "Gift520FlowerBox"
		gift.object_id = "gift_520_flower_box"
		gift.gift_id = "gift_520_flower_box"
		gift.display_name = "520 Gift Set"
		gift.story = "An interactive floral keepsake presented in the private memory gallery."
		gift.pages = [
			"The flower box can be opened and closed in place, revealing the inner keepsake without leaving the room.",
			"Its display state is saved locally first and restored when this home is visited again."
		]
		gift.animation_mode = "reveal"
		gift.visual_root = flower
		gift.position = Vector3(-1.15, 1.45, 5.82)
		gift.add_child(_area_shape(Vector3(1.72, 1.92, 1.68)))
		add_child(gift)

	var lantern := _load_model("christmas_music_lantern.glb", Vector3(-4.55, 0.88, 6.0), 0.0)
	if lantern:
		var gift := AnimatedGiftInteractable.new()
		gift.name = "ChristmasMusicLantern"
		gift.object_id = "christmas_music_lantern"
		gift.gift_id = "christmas_music_lantern"
		gift.display_name = "Christmas Music Lantern"
		gift.story = "A winter lantern with warm light, moving snow and an original music-box motif."
		gift.pages = [
			"Switch the lantern on to illuminate the miniature scene and start its gentle chime.",
			"The chime is generated inside DearV and the lantern remembers whether it was left playing."
		]
		gift.animation_mode = "lantern"
		gift.visual_root = lantern
		gift.position = Vector3(-4.55, 1.55, 5.82)
		gift.add_child(_area_shape(Vector3(1.72, 2.35, 1.68)))
		add_child(gift)


func _build_vitrine(node_name: String, center: Vector3, size: Vector3) -> void:
	# Stone plinth, bronze reveal line, then five thin glass planes instead of an opaque box.
	_add_box("%sPlinth" % node_name, Vector3(center.x, 0.79, center.z), Vector3(size.x, 0.16, size.z), stone)
	_add_trim(Vector3(center.x, 0.895, center.z), Vector3(size.x + 0.05, 0.045, size.z + 0.05))
	var half_x := size.x * 0.5
	var half_z := size.z * 0.5
	var glass_y := 1.63
	var glass_h := 1.42
	_add_box("%sGlassFront" % node_name, Vector3(center.x, glass_y, center.z - half_z), Vector3(size.x, glass_h, 0.025), glass)
	_add_box("%sGlassBack" % node_name, Vector3(center.x, glass_y, center.z + half_z), Vector3(size.x, glass_h, 0.025), glass)
	_add_box("%sGlassLeft" % node_name, Vector3(center.x - half_x, glass_y, center.z), Vector3(0.025, glass_h, size.z), glass)
	_add_box("%sGlassRight" % node_name, Vector3(center.x + half_x, glass_y, center.z), Vector3(0.025, glass_h, size.z), glass)
	_add_box("%sGlassTop" % node_name, Vector3(center.x, 2.34, center.z), Vector3(size.x, 0.025, size.z), glass)
	_add_collision_box("%sCollision" % node_name, Vector3(center.x, 1.56, center.z), Vector3(size.x, 1.60, size.z))


func _add_spot(from: Vector3, target: Vector3, energy := 1.15) -> void:
	var light := SpotLight3D.new()
	light.name = "GallerySpot"
	light.position = from
	light.light_color = Color("ffd3a0")
	light.light_energy = energy
	light.spot_range = 4.2
	light.spot_angle = 31.0
	light.shadow_enabled = true
	light.look_at_from_position(from, target, Vector3.UP)
	add_child(light)


func _add_label_plaque(position: Vector3, size: Vector3) -> void:
	_add_box("MemoryLabel", position, size, label_material)
	_add_box("MemoryLabelInset", position + Vector3(0.0, 0.0, -0.032), Vector3(size.x * 0.84, size.y * 0.42, 0.015), velvet)


func _load_model(filename: String, world_position: Vector3, rotation_y: float) -> Node3D:
	var path := MODEL_ROOT + filename
	if not ResourceLoader.exists(path):
		push_warning("Memory hero asset is missing: %s" % path)
		return null
	var packed := ResourceLoader.load(path) as PackedScene
	if not packed:
		return null
	var model := packed.instantiate() as Node3D
	if not model:
		return null
	model.name = filename.get_basename().to_pascal_case()
	model.position = world_position
	model.rotation_degrees.y = rotation_y
	add_child(model)
	return model


func _add_collision_box(node_name: String, position: Vector3, size: Vector3) -> void:
	var body := StaticBody3D.new()
	body.name = node_name
	body.position = position
	var shape_node := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	shape_node.shape = shape
	body.add_child(shape_node)
	add_child(body)


func _add_trim(position: Vector3, size: Vector3) -> void:
	_add_box("GalleryTrim", position, size, bronze)


func _add_box(node_name: String, position: Vector3, size: Vector3, material: Material) -> MeshInstance3D:
	var mesh_node := MeshInstance3D.new()
	mesh_node.name = node_name
	mesh_node.position = position
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh.material = material
	mesh_node.mesh = mesh
	add_child(mesh_node)
	return mesh_node


func _area_shape(size: Vector3) -> CollisionShape3D:
	var node := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	node.shape = shape
	return node
