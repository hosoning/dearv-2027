class_name FoodDefinition
extends Resource

@export var id := ""
@export var display_name := "Ingredient"
@export var icon: Texture2D
@export var raw_scene: PackedScene
@export var washed_scene: PackedScene
@export var chopped_scene: PackedScene
@export var cooked_scene: PackedScene
@export var plated_scene: PackedScene
@export var can_wash := true
@export var can_chop := true
@export var can_cook := true
@export var default_location := "fridge"
