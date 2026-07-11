import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  LockKeyhole,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ICT_CHAPTERS, ICT_COURSE } from "@/lib/curriculum/ict-course";
import { getI18n } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export default async function LandingPage() {
  const { t, dictionary } = await getI18n();

  const features = [
    {
      icon: LockKeyhole,
      title: dictionary.landing.features[0].title,
      text: dictionary.landing.features[0].text,
    },
    {
      icon: BrainCircuit,
      title: dictionary.landing.features[1].title,
      text: dictionary.landing.features[1].text,
    },
    {
      icon: PlayCircle,
      title: dictionary.landing.features[2].title,
      text: dictionary.landing.features[2].text,
    },
  ];

  return (
    <main>
      <section className="mx-auto grid min-h-[92vh] max-w-7xl gap-10 px-5 py-8 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <nav className="mb-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <span className="font-semibold text-white">{t("brand.short")}</span>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher compact />
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">{t("common.signIn")}</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">{t("common.join")}</Button>
              </Link>
            </div>
          </nav>

          <Badge>
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            {t("brand.personalAcademy")}
          </Badge>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("landing.headline")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            {t("landing.description")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                {t("landing.startLearning")}
                <ArrowRight className="mx-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                {t("landing.studentSignIn")}
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            <div>
              <p className="text-2xl font-semibold text-white">{ICT_COURSE.totalChapters}</p>
              <p className="text-sm text-slate-400">{t("landing.chapters")}</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{ICT_COURSE.totalLessons}</p>
              <p className="text-sm text-slate-400">{t("landing.lessons")}</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">1:1</p>
              <p className="text-sm text-slate-400">{t("landing.instructorIdentity")}</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="academy-panel overflow-hidden rounded-lg">
            <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr] lg:grid-cols-1 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="relative min-h-[360px]">
                <Image
                  src="/images/ahmed-abdelmegid.jpg"
                  alt={t("brand.instructor")}
                  fill
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="p-6">
                <Badge className="mb-4">{t("landing.instructorBadge")}</Badge>
                <h2 className="text-2xl font-semibold text-white">{t("brand.instructor")}</h2>
                <p className="mt-1 text-cyan-200">{t("brand.role")}</p>
                <p className="text-sm text-slate-400">{t("brand.subtitle")}</p>
                <div className="mt-6 space-y-3">
                  {dictionary.landing.checklist.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-cyan-300 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="p-6">
                <feature.icon className="h-7 w-7 text-cyan-300" />
                <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 academy-panel rounded-lg p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge>{t("landing.firstCourse")}</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-white">{ICT_COURSE.title}</h2>
              <p className="mt-1 text-slate-400">{ICT_COURSE.subtitle}</p>
            </div>
            <p className="text-sm text-slate-400">{t("landing.chaptersFromPdf", { count: ICT_CHAPTERS.length })}</p>
          </div>
          <div className="mt-6 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {ICT_CHAPTERS.slice(0, 6).map((chapter) => (
              <div key={chapter.chapterNumber} className="academy-surface rounded-lg p-4">
                <p className="text-xs text-cyan-200">{dictionary.landing.chapters} {chapter.chapterNumber}</p>
                <p className="mt-1 font-medium text-white">{chapter.title}</p>
                <p className="mt-2 text-sm text-slate-500">{chapter.lessons.length} {dictionary.landing.lessons}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
