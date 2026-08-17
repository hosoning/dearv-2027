class_name MemoryGallery
extends Node3D

const MODEL_ROOT := "res://assets/models/"

var bronze := StandardMaterial3D.new()
var stone := StandardMaterial3D.new()


func _ready() -> void:
	bronze.albedo_color = Color("5f4129")
	bronze.roughness = 0.34
	bronze.metallic = 0.58
	stone.albedo_color = Color("d4c9b9")
	stone.roughness = 0.48
	_build_display_zone()


func _build_display_zone() -> void:
	# A dedicated low display console keeps hero gifts grounded in the home rather than floating in the room.
	_add_pedestal("MemoryConsole", Vector3(-2.8, 0.36, 6.0), Vector3(5.2, 0.72, 1.15))
	_add_pedestal("LanternPlinth", Vector3(-4.55, 0.82, 6.0), Vector3(1.45, 0.12, 1.05))
	_add_pedestal("FlowerGiftPlinth", Vector3(-1.15, 0.82, 6.0), Vector3(1.45, 0.12, 1.05))

	var flower := _load_model("gift_520_flower_box.glb", Vector3(-1.15, 0.88, 6.0), 0.0)
	if flower:
		var gift := AnimatedGiftInteractable.new()
		gift.name = "Gift520FlowerBox"
		gift.object_id = "gift_520_flower_box"
		gift.gift_id = "gift_520_flower_box"
		gift.display_name = "520 Gift Set"
		gift.animation_mode = "reveal"
		gift.visual_root = flower
		gift.position = Vector3(-1.15, 1.45, 5.9)
		gift.add_child(_area_shape(Vector3(1.8, 1.9, 1.8)))
		add_child(gift)

	var lantern := _load_model("christmas_music_lantern.glb", Vector3(-4.55, 0.88, 6.0), 0.0)
	if lantern:
		var gift := AnimatedGiftInteractable.new()
		gift.name = "ChristmasMusicLantern"
		gift.object_id = "christmas_music_lantern"
		gift.gift_id = "christmas_music_lantern"
		gift.display_name = "Christmas Music Lantern"
		gift.animation_mode = "lantern"
		gift.visual_root = lantern
		gift.position = Vector3(-4.55, 1.55, 5.9)
		gift.add_child(_area_shape(Vector3(1.8, 2.4, 1.8)))
		add_child(gift)


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


func _add_pedestal(node_name: String, position: Vector3, size: Vector3) -> void:
	var mesh_node := MeshInstance3D.new()
	mesh_node.name = node_name
	mesh_node.position = position
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh.material = stone
	mesh_node.mesh = mesh
	add_child(mesh_node)
	var trim := MeshInstance3D.new()
	trim.name = "%sTrim" % node_name
	trim.position = position + Vector3(0.0, size.y * 0.5 + 0.025, 0.0)
	var trim_mesh := BoxMesh.new()
	trim_mesh.size = Vector3(size.x + 0.08, 0.05, size.z + 0.08)
	trim_mesh.material = bronze
	trim.mesh = trim_mesh
	add_child(trim)


func _area_shape(size: Vector3) -> CollisionShape3D:
	var node := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	node.shape = shape
	return node
