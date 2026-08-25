shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_back, diffuse_burley, specular_schlick_ggx;

uniform vec3 deep_color : source_color = vec3(0.010, 0.075, 0.135);
uniform vec3 mid_color : source_color = vec3(0.025, 0.235, 0.315);
uniform vec3 horizon_color : source_color = vec3(0.19, 0.49, 0.56);
uniform vec3 foam_color : source_color = vec3(0.76, 0.92, 0.94);
uniform float wave_height : hint_range(0.0, 2.0) = 0.42;
uniform float wave_scale : hint_range(0.05, 2.0) = 0.22;
uniform float wave_speed : hint_range(0.0, 3.0) = 0.46;
uniform float roughness_value : hint_range(0.0, 1.0) = 0.12;

varying float wave;
varying float ripple;
varying vec3 displaced_world_position;

float wave_field(vec2 p, float t) {
	float swell = sin(dot(p, normalize(vec2(1.0, 0.20))) * 1.35 + t);
	float crossing = sin(dot(p, normalize(vec2(-0.42, 1.0))) * 2.10 + t * 1.27) * 0.52;
	float diagonal = sin(dot(p, normalize(vec2(0.72, 0.70))) * 3.75 - t * 0.68) * 0.24;
	float long_swell = sin(dot(p, normalize(vec2(-0.86, 0.36))) * 0.72 - t * 0.44) * 0.32;
	return (swell + crossing + diagonal + long_swell) / 2.08;
}

float ripple_field(vec2 p, float t) {
	float first = sin(dot(p, vec2(0.92, 0.38)) * 12.0 + t * 2.25);
	float second = sin(dot(p, vec2(-0.31, 0.95)) * 17.0 - t * 1.65);
	return (first + second) * 0.5;
}

void vertex() {
	vec2 p = VERTEX.xz * wave_scale;
	float t = TIME * wave_speed;
	wave = wave_field(p, t);
	ripple = ripple_field(p, t);
	VERTEX.y += wave * wave_height + ripple * 0.025;

	float eps = 0.065;
	float wx = wave_field(p + vec2(eps, 0.0), t);
	float wz = wave_field(p + vec2(0.0, eps), t);
	float rx = ripple_field(p + vec2(eps, 0.0), t);
	float rz = ripple_field(p + vec2(0.0, eps), t);
	NORMAL = normalize(vec3(
		(wave - wx) * 3.0 + (ripple - rx) * 0.055,
		eps,
		(wave - wz) * 3.0 + (ripple - rz) * 0.055
	));
	displaced_world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float facing = clamp(dot(normalize(NORMAL), normalize(VIEW)), 0.0, 1.0);
	float fresnel = pow(1.0 - facing, 3.4);
	float depth_tone = smoothstep(-0.82, 0.82, wave);
	float horizon_haze = smoothstep(110.0, 285.0, length(displaced_world_position.xz));

	vec3 water = mix(deep_color, mid_color, depth_tone * 0.72 + 0.12);
	water = mix(water, horizon_color, fresnel * 0.55 + horizon_haze * 0.20);

	float crest = smoothstep(0.58, 0.96, wave + abs(ripple) * 0.055);
	float broken_foam = smoothstep(0.35, 0.82, sin(displaced_world_position.x * 0.32 + TIME) * 0.5 + 0.5);
	water = mix(water, foam_color, crest * broken_foam * 0.24);

	float fine_glint = pow(max(0.0, ripple * 0.5 + 0.5), 12.0) * (1.0 - facing) * 0.32;
	ALBEDO = water + foam_color * fine_glint;
	ROUGHNESS = clamp(roughness_value + (1.0 - fresnel) * 0.18 + crest * 0.10, 0.08, 0.42);
	METALLIC = 0.0;
	SPECULAR = 0.96;
}
