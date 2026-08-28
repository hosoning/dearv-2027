class_name ServingStationInteractable
extends Interactable

@export var source_location := "induction_stove"
@export var serving_location := "dining_table"
@export var display_name := "Dining table"

var _visual_root: Node3D


func _ready() -> void:
	super._ready()
	_visual_root = Node3D.new()
	_visual_root.name = "ServedMealVisuals"
	add_child(_visual_root)
	Kitchen.prepared_food_changed.connect(_on_prepared_food_changed)
	_refresh_table()


func get_prompt() -> String:
	if not Kitchen.get_prepared_food(serving_location).is_empty():
		return "Enjoy meal at %s" % display_name.to_lower()
	return "Serve meal at %s" % display_name.to_lower()


func interact(_actor: Node3D) -> void:
	AppState.open_inspector({
		"kind": "serving",
		"title": display_name,
		"source_location": source_location,
		"serving_location": serving_location,
		"items": Kitchen.get_prepared_food(),
	})


func _on_prepared_food_changed(location: String) -> void:
	if location == serving_location or location == source_location:
		_refresh_table()


func _refresh_table() -> void:
	if not _visual_root:
		return
	for child in _visual_root.get_children():
		child.queue_free()
	var meals := Kitchen.get_prepared_food(serving_location)
	var slots := [
		Vector3(-0.72, -0.15, -0.25),
		Vector3(0.72, -0.15, -0.25),
		Vector3(-0.72, -0.15, 0.25),
		Vector3(0.72, -0.15, 0.25),
	]
	for index in range(mini(meals.size(), slots.size())):
		_add_place_setting(slots[index], index)


func _add_place_setting(local_position: Vector3, index: int) -> void:
	var plate := MeshInstance3D.new()
	plate.name = "DinnerPlate%d" % index
	var plate_mesh := CylinderMesh.new()
	plate_mesh.top_radius = 0.22
	plate_mesh.bottom_radius = 0.24
	plate_mesh.height = 0.025
	plate_mesh.radial_segments = 32
	plate_mesh.material = _material(Color("ece5db"), 0.24)
	plate.mesh = plate_mesh
	plate.position = local_position
	_visual_root.add_child(plate)

	var meal := MeshInstance3D.new()
	meal.name = "ServedMeal%d" % index
	var meal_mesh := SphereMesh.new()
	meal_mesh.radius = 0.13
	meal_mesh.height = 0.11
	meal_mesh.radial_segments = 24
	meal_mesh.rings = 12
	meal_mesh.material = _material(Color("bd8058") if index % 2 == 0 else Color("849565"), 0.58)
	meal.mesh = meal_mesh
	meal.position = local_position + Vector3(0.0, 0.055, 0.0)
	meal.scale = Vector3(1.25, 0.52, 0.88)
	_visual_root.add_child(meal)

	var cutlery := MeshInstance3D.new()
	cutlery.name = "Cutlery%d" % index
	var cutlery_mesh := BoxMesh.new()
	cutlery_mesh.size = Vector3(0.025, 0.018, 0.32)
	cutlery_mesh.material = _material(Color("c8ad82"), 0.20)
	cutlery.mesh = cutlery_mesh
	cutlery.position = local_position + Vector3(0.31, 0.01, 0.0)
	_visual_root.add_child(cutlery)


func _material(color: Color, roughness: float) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = roughness
	material.metallic = 0.55 if roughness < 0.22 else 0.0
	return material
