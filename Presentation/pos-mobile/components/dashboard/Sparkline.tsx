import React, { memo, useMemo } from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

interface SparklineProps {
  values: number[];
  width: number;
  height?: number;
  color?: string;
}

export const Sparkline = memo(function Sparkline({
  values,
  width,
  height = 64,
  color = "#2563EB",
}: SparklineProps) {
  const { line, area, last } = useMemo(() => {
    if (values.length === 0 || width <= 0) {
      return { line: "", area: "", last: null as { x: number; y: number } | null };
    }

    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const pad = 4;
    const points = values.map((value, index) => {
      const x =
        values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - pad - ((value - min) / range) * (height - pad * 2);
      return { x, y };
    });

    const linePath = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const end = points[points.length - 1];
    const areaPath = `${linePath} L ${end.x} ${height} L ${points[0].x} ${height} Z`;

    return { line: linePath, area: areaPath, last: end };
  }, [values, width, height]);

  if (!line) {
    return <View style={{ width, height }} />;
  }

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="dashSpark" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.22} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#dashSpark)" />
      <Path
        d={line}
        stroke={color}
        strokeWidth={2.25}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last ? (
        <Circle
          cx={last.x}
          cy={last.y}
          r={3.5}
          fill={color}
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      ) : null}
    </Svg>
  );
});
