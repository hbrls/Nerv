import { HexGrid, Layout, Hexagon, Text, Hex } from "react-hexgrid";

export function Nerv() {
  const hexagons = [new Hex(0, 0, 0)];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Hello Nerv</h1>
      <HexGrid width={800} height={600} viewBox="-50 -50 100 100">
        <Layout size={{ x: 8, y: 8 }} flat={true} spacing={1.1} origin={{ x: 0, y: 0 }}>
          {hexagons.map((hex) => (
            <Hexagon key={`${hex.q},${hex.r},${hex.s}`} q={hex.q} r={hex.r} s={hex.s}>
              <Text>{`${hex.q},${hex.r},${hex.s}`}</Text>
            </Hexagon>
          ))}
        </Layout>
      </HexGrid>
    </div>
  );
}
