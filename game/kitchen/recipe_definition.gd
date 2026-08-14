class_name RecipeDefinition
extends Resource

@export var id := ""
@export var display_name := "Recipe"
@export var required_ingredients: Array[String] = []
@export var required_stages: Array[String] = []
@export var appliance := "stove"
@export_range(1.0, 600.0, 1.0) var cook_seconds := 10.0
@export var result_scene: PackedScene
@export_multiline var serving_note := ""
