extends Node

signal asset_ready(asset_key: String, scene: Node3D)
signal asset_failed(asset_key: String, message: String)

const CACHE_FOLDER := "user://asset_cache"
const MAX_ASSET_BYTES := 50 * 1024 * 1024

var _memory_cache: Dictionary = {}
var _inflight: Dictionary = {}


func load_glb(asset_url: String, asset_id: String, version: int) -> Node3D:
	var asset_key := "%s@%d" % [asset_id, version]
	if _memory_cache.has(asset_key):
		return (_memory_cache[asset_key] as Node3D).duplicate()
	if _inflight.has(asset_key):
		await _inflight[asset_key]
		if _memory_cache.has(asset_key):
			return (_memory_cache[asset_key] as Node3D).duplicate()
		return null

	var completion := SignalAwaiter.new()
	_inflight[asset_key] = completion.completed
	var scene := await _download_and_import(asset_url, asset_key)
	if scene:
		_memory_cache[asset_key] = scene
		asset_ready.emit(asset_key, scene)
	else:
		asset_failed.emit(asset_key, "The 3D asset could not be downloaded or imported.")
	completion.finish()
	_inflight.erase(asset_key)
	return scene.duplicate() if scene else null


func _download_and_import(asset_url: String, asset_key: String) -> Node3D:
	var safe_name := asset_key.validate_filename().replace("@", "_") + ".glb"
	var global_folder := ProjectSettings.globalize_path(CACHE_FOLDER)
	DirAccess.make_dir_recursive_absolute(global_folder)
	var cache_path := CACHE_FOLDER.path_join(safe_name)
	if not FileAccess.file_exists(cache_path):
		var bytes := await _download(asset_url)
		if bytes.is_empty():
			return null
		var file := FileAccess.open(cache_path, FileAccess.WRITE)
		if not file:
			return null
		file.store_buffer(bytes)
	return _import_glb(cache_path)


func _download(asset_url: String) -> PackedByteArray:
	var request := HTTPRequest.new()
	request.download_chunk_size = 256 * 1024
	request.body_size_limit = MAX_ASSET_BYTES
	add_child(request)
	var headers := PackedStringArray()
	if not AppState.access_token.is_empty() and asset_url.begins_with(Supabase.base_url):
		headers.append("Authorization: Bearer %s" % AppState.access_token)
		headers.append("apikey: %s" % Supabase.publishable_key)
	var error := request.request(asset_url, headers)
	if error != OK:
		request.queue_free()
		return PackedByteArray()
	var response: Array = await request.request_completed
	request.queue_free()
	var status: int = response[1]
	if status < 200 or status >= 300:
		return PackedByteArray()
	return response[3] as PackedByteArray


func _import_glb(path: String) -> Node3D:
	var document := GLTFDocument.new()
	var state := GLTFState.new()
	var error := document.append_from_file(path, state)
	if error != OK:
		push_error("GLB import failed for %s: %s" % [path, error_string(error)])
		return null
	return document.generate_scene(state)


class SignalAwaiter:
	extends RefCounted
	signal completed

	func finish() -> void:
		completed.emit()
