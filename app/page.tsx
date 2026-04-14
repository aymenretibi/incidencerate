import { CalculatorForm } from "@/components/CalculatorForm";
import { MARKETS } from "@/lib/benchmarks/baseIR";

export default function Home() {
  return <CalculatorForm markets={MARKETS} />;
}
