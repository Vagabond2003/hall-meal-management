import { Metadata } from "next";
import WeeklyMenuClient from "./WeeklyMenuClient";

export const metadata: Metadata = {
  title: "Weekly Menu Planner - Hall Meal Management",
  description: "Plan the weekly menu for student meals.",
};

export default function WeeklyMenuPage() {
  return <WeeklyMenuClient />;
}
