import { Courses } from "~/components/home-page/courses";
import { Title } from "~/components/home-page/title";

export default function Home() {
  return (
    <main className="p-4 md:p-6">
      <Title />
      <Courses />
    </main>
  );
}
