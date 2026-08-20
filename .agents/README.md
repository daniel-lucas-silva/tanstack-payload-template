# Google AI Studio — Built-in Skills

This repository contains a collection of built-in skills for Google AI Studio. Each skill lives in its own directory under `skills/` and includes a `SKILL.md` file that documents its purpose, usage examples, and implementation notes.

Overview of skills

- `design_guidelines/`: Comprehensive UI design principles and multiple visual styles.
- `focus_mode/`: Instructions for UI element positioning and local modifications.
- `gemini_api/`: Core SDK usage guide, including text generation, multimodal features, and streaming.
- `image_generation/`: Image generation strategies and prompt-writing guidelines.
- `realtime_guidelines/`: Real-time interaction, WebSocket patterns, and collaborative canvas guidance.
- `shadcn/`: Usage of the `shadcn/ui` component library and CLI configuration.
- `google_maps_platform/`: Maps API integration patterns and best practices.
- `oauth/`: Handling third-party auth flows inside iframe environments.
- `firebase-skill/`: Database integrations, security rules, and error handling for Firebase.
- `github_import_migration/`: Compatibility and migration guidelines for importing external projects into AI Studio.
- `gemini_connect/`: API call guidance for quota-sensitive scenarios.

How to use

- Open the `SKILL.md` file inside any skill directory for detailed documentation and examples. For example, see `skills/image_generation/SKILL.md` for image generation specifics.
- Each `SKILL.md` should include expected inputs, configuration, example requests, and any runtime or dependency notes.

Contributing

- To add or improve a skill, edit the corresponding `SKILL.md` and submit a pull request.
- Keep documentation clear, include runnable examples where possible, and list any required dependencies or setup steps.
