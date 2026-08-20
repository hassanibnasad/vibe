from pathlib import Path

from jinja2 import Environment, FileSystemLoader, Template

_prompts_dir = Path(__file__).parent
_env = Environment(
    loader=FileSystemLoader(str(_prompts_dir)),
    autoescape=False,
)


def load_prompt(template_name: str) -> Template:
    return _env.get_template(template_name)


__all__ = ["load_prompt"]
