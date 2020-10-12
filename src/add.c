// clang --target=wasm32 -nostdlib -Wl,--no-entry -Wl,--export-all -o add.wasm add.c

int add(int x, int y)
{
  return x + y;
}
