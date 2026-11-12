"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { libraryStateChangedEvent, readFavoriteLibraryItems, readRecentLibraryItems, recordRecentLibraryItem, toggleFavoriteLibraryItem } from "../../../lib/recent-library";

type LibraryResource = {
  title: string;
  organization: string;
  description: string;
  url: string;
  keywords: string;
};

const categories: { id: string; title: string; resources: LibraryResource[] }[] = [
  {
    id: "guias-oficiales",
    title: "Guías oficiales",
    resources: [
      { title: "Guías de práctica clínica del IMSS", organization: "IMSS", description: "Acceso al catálogo institucional para profesionales de la salud.", url: "https://www.imss.gob.mx/profesionales-salud/gpc", keywords: "gpc guías práctica clínica imss" },
      { title: "Catálogo Maestro de Guías de Práctica Clínica", organization: "CENETEC / Secretaría de Salud", description: "Buscador de guías del Sistema Nacional de Salud; revisa la ficha y fecha de actualización de cada documento.", url: "https://cenetec-difusion.com/gpc-sns/", keywords: "cenetec secretaría salud catálogo maestro guías" },
      { title: "Protocolos Nacionales de Atención Médica (PRONAM)", organization: "Consejo de Salubridad General", description: "Protocolos nacionales basados en evidencia para prevención, diagnóstico y tratamiento.", url: "https://pronamsalud.csg.gob.mx/", keywords: "pronam protocolos nacionales atención médica" },
      { title: "Protocolos de Atención Integral (PAI)", organization: "IMSS", description: "Protocolos institucionales y algoritmos clínico-terapéuticos para el personal de salud.", url: "https://www.imss.gob.mx/profesionales-salud/investigacion", keywords: "pai protocolo atención integral algoritmos imss" },
      { title: "Normas Oficiales Mexicanas", organization: "Diario Oficial de la Federación", description: "Consulta normas publicadas y avisos recientes; comprueba el estado vigente de cada NOM.", url: "https://www.dof.gob.mx/normasOficiales.php", keywords: "nom norma normas oficiales mexicanas dof" },
    ],
  },
  {
    id: "guias-externas",
    title: "Guías externas",
    resources: [
      { title: "Standards of Care in Diabetes", organization: "American Diabetes Association (ADA)", description: "Recomendaciones clínicas de diabetes con actualización anual.", url: "https://professional.diabetes.org/standards-of-care", keywords: "ada diabetes standards diabetes mellitus" },
      { title: "Guidelines & Statements", organization: "American Heart Association (AHA) / American Stroke Association (ASA)", description: "Guías y declaraciones científicas de enfermedades cardiovasculares y evento vascular cerebral.", url: "https://professional.heart.org/guidelines-and-statements", keywords: "aha asa cardiovascular cardiología stroke cerebro" },
      { title: "Clinical Guidance", organization: "American College of Obstetricians and Gynecologists (ACOG)", description: "Guías y documentos de práctica clínica en obstetricia y ginecología.", url: "https://www.acog.org/clinical/clinical-guidance", keywords: "acog ginecología obstetricia embarazo" },
      { title: "Guidelines", organization: "World Health Organization (WHO/OMS)", description: "Recomendaciones y directrices internacionales de salud.", url: "https://www.who.int/publications/who-guidelines", keywords: "oms who guías internacionales salud" },
    ],
  },
  {
    id: "libros",
    title: "Libros",
    resources: [
      { title: "NCBI Bookshelf", organization: "National Library of Medicine (NIH/NLM)", description: "Libros y documentos gratuitos de biomedicina, ciencias de la vida y atención de la salud.", url: "https://www.ncbi.nlm.nih.gov/books/", keywords: "ncbi bookshelf libros gratuitos medicina biomedicina" },
      { title: "Anatomy and Physiology 2e", organization: "OpenStax / Rice University", description: "Libro abierto y gratuito de anatomía y fisiología.", url: "https://openstax.org/details/books/anatomy-and-physiology-2e", keywords: "openstax anatomía fisiología libro abierto gratuito" },
      { title: "Publicaciones de salud", organization: "World Health Organization (WHO/OMS)", description: "Publicaciones y manuales de salud disponibles en el repositorio de la OMS.", url: "https://www.who.int/publications/i", keywords: "oms who libros publicaciones manuales salud" },
    ],
  },
  {
    id: "conectate",
    title: "Conéctate con tu biblioteca",
    resources: [
      { title: "Abrir UpToDate", organization: "Wolters Kluwer", description: "Abre la página oficial para iniciar sesión con tu cuenta o el acceso de tu institución.", url: "https://www.uptodate.com/login", keywords: "uptodate iniciar sesión cuenta institucional biblioteca" },
      { title: "Abrir ClinicalKey", organization: "Elsevier", description: "Accede al inicio de sesión y a las opciones de acceso institucional de ClinicalKey.", url: "https://www.clinicalkey.com/", keywords: "clinicalkey elsevier iniciar sesión cuenta institucional" },
      { title: "Abrir AccessMedicine", organization: "McGraw Hill", description: "Abre la plataforma de libros y recursos médicos de McGraw Hill.", url: "https://accessmedicine.mhmedical.com/", keywords: "accessmedicine mcgraw hill libros plataforma médica" },
    ],
  },
];

const inputClass = "mt-2 w-full rounded-xl border border-[#DCE9E6] bg-white px-4 py-3 text-[#123C50] outline-none focus:border-[#18A69A] focus:ring-2 focus:ring-[#18A69A]/15";

function normalizeLibrarySearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX");
}

function ResourceCard({ resource, favorite, onToggleFavorite, onOpen }: { resource: LibraryResource; favorite: boolean; onToggleFavorite: () => void; onOpen: () => void }) {
  return (
    <article className="rounded-xl bg-[#F8FBFA] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#16877F]">{resource.organization}</p>
          <h3 className="mt-1 font-bold">{resource.title}</h3>
        </div>
        <button type="button" aria-pressed={favorite} aria-label={`${favorite ? "Quitar" : "Agregar"} ${resource.title} ${favorite ? "de" : "a"} favoritos`} onClick={onToggleFavorite} className="shrink-0 rounded-lg px-3 py-2 font-bold text-[#16877F] hover:bg-white">{favorite ? "★" : "☆"}</button>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{resource.description}</p>
      <a href={resource.url} target="_blank" rel="noreferrer" onClick={onOpen} className="mt-3 inline-block font-bold text-[#16877F] underline underline-offset-4">Abrir sitio ↗</a>
    </article>
  );
}

export default function ProfessionalLibraryPage() {
  const [query, setQuery] = useState("");
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [favoriteUrls, setFavoriteUrls] = useState<string[]>([]);
  useEffect(() => {
    const syncLibraryState = () => {
      setRecentUrls(readRecentLibraryItems());
      setFavoriteUrls(readFavoriteLibraryItems());
    };
    syncLibraryState();
    window.addEventListener(libraryStateChangedEvent, syncLibraryState);
    window.addEventListener("storage", syncLibraryState);
    return () => {
      window.removeEventListener(libraryStateChangedEvent, syncLibraryState);
      window.removeEventListener("storage", syncLibraryState);
    };
  }, []);
  const allResources = useMemo(() => categories.flatMap((category) => category.resources), []);
  const recentResources = useMemo(() => recentUrls.flatMap((url) => { const resource = allResources.find((item) => item.url === url); return resource ? [resource] : []; }), [allResources, recentUrls]);
  const favoriteResources = useMemo(() => favoriteUrls.flatMap((url) => { const resource = allResources.find((item) => item.url === url); return resource ? [resource] : []; }), [allResources, favoriteUrls]);
  const filteredCategories = useMemo(() => {
    const normalizedQuery = normalizeLibrarySearch(query.trim());
    return categories.map((category) => ({
      ...category,
      resources: category.resources.filter((resource) =>
        !normalizedQuery || `${resource.title} ${resource.organization} ${resource.description} ${resource.keywords}`
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX").includes(normalizedQuery),
      ),
    })).filter((category) => category.resources.length > 0);
  }, [query]);
  const markResourceOpened = (resource: LibraryResource) => setRecentUrls(recordRecentLibraryItem(resource.url));
  const toggleResourceFavorite = (resource: LibraryResource) => setFavoriteUrls(toggleFavoriteLibraryItem(resource.url));

  return (
    <main className="min-h-screen bg-[#F4F8F7] px-5 py-8 text-[#123C50] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="font-bold text-[#16877F]">← Volver al inicio</Link>
        <p className="mt-7 text-sm font-bold uppercase tracking-widest text-[#18A69A]">Herramientas para profesionales</p>
        <h1 className="mt-2 text-3xl font-extrabold">Mi Biblioteca</h1>
        <label className="mt-5 block text-sm font-semibold">
          Buscar en la biblioteca
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} className={inputClass} placeholder="Buscar guías, NOM, libros o plataformas" />
        </label>

        <div className="mt-5 grid gap-4 lg:grid-cols-2" aria-label="Favoritos y recursos recientes">
            <section className="rounded-2xl border border-[#DCE9E6] bg-white p-5 shadow-sm" aria-label="Favoritos de biblioteca">
              <h2 className="text-lg font-extrabold">Favoritos</h2>
              {favoriteResources.length ? <div className="mt-3 space-y-3">{favoriteResources.map((resource) => <ResourceCard key={resource.url} resource={resource} favorite onToggleFavorite={() => toggleResourceFavorite(resource)} onOpen={() => markResourceOpened(resource)} />)}</div> : <p className="mt-2 text-sm text-slate-600">Marca con ☆ las fuentes que quieras dejar a mano.</p>}
            </section>
            <section className="rounded-2xl border border-[#DCE9E6] bg-white p-5 shadow-sm" aria-label="Recursos recientes de biblioteca">
              <h2 className="text-lg font-extrabold">Recientes</h2>
              {recentResources.length ? <div className="mt-3 space-y-3">{recentResources.map((resource) => <ResourceCard key={resource.url} resource={resource} favorite={favoriteUrls.includes(resource.url)} onToggleFavorite={() => toggleResourceFavorite(resource)} onOpen={() => markResourceOpened(resource)} />)}</div> : <p className="mt-2 text-sm text-slate-600">Al abrir una fuente aparecerá aquí para que puedas volver rápido.</p>}
            </section>
        </div>

        <div className="mt-6 space-y-4" aria-label="Categorías de la biblioteca">
          {filteredCategories.map((category) => (
            <details key={category.id} id={category.id} className="group rounded-2xl border border-[#DCE9E6] bg-white p-5 shadow-sm sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-xl font-extrabold">{category.title}</span>
                <span className="rounded-full bg-[#E9F4F2] px-3 py-1 text-sm font-bold text-[#16877F] group-open:rotate-180" aria-hidden="true">⌄</span>
              </summary>
              <div className="mt-4 space-y-4 border-t border-[#DCE9E6] pt-4">
                {category.resources.map((resource) => (
                  <ResourceCard key={resource.url} resource={resource} favorite={favoriteUrls.includes(resource.url)} onToggleFavorite={() => toggleResourceFavorite(resource)} onOpen={() => markResourceOpened(resource)} />
                ))}
              </div>
            </details>
          ))}
          {filteredCategories.length === 0 && <p role="status" className="rounded-xl bg-white p-5 text-slate-600">No se encontraron recursos con ese término.</p>}
        </div>

        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">Los enlaces abren sitios externos. Algunos recursos pueden requerir una cuenta, suscripción o acceso de tu institución. Verifica la vigencia en la fuente original; esta biblioteca no sustituye el criterio clínico.</p>
      </div>
    </main>
  );
}
