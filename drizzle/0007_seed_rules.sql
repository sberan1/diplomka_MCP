-- Initial set of syllabus validation rules (R1-R12). ON CONFLICT DO NOTHING
-- keeps this idempotent and safe to run against a DB where SubmitEvaluationTool
-- already upserted some of these codes (it only sets name/type on conflict,
-- never description, so re-running this afterwards would otherwise be the
-- only way to backfill it).
INSERT INTO "rules" ("code", "name", "description", "type") VALUES
('R1', 'Shoda ECTS a celkové studijní zátěže', 'Porovnej ECTS × HODIN_NA_KREDIT s hodnotou „Celkem“ v tabulce zátěže (tolerance ±1 h).', 'error'),
('R2', 'Vazba studijních aktivit na hodnocení', 'Zkontroluj, zda každá aktivita s nenulovými hodinami (kromě účasti na přednáškách/cvičeních) má odpovídající kritérium hodnocení.', 'warning'),
('R3', 'Shoda názvu v jazyce výuky', 'Ověř shodu názvu v jazyce výuky s názvem česky/anglicky dle jazyka.', 'error'),
('R4', 'Shoda dotace a hodin účasti', 'Porovnej dotaci X/Y s hodinami účasti na přednáškách/cvičeních.', 'error'),
('R5', 'Násobek počtu týdnů semestru', 'Hodiny účasti musí být násobkem POCET_TYDNU_SEMESTR.', 'error'),
('R6', 'Formát výsledků učení', 'Výsledky učení musí začínat definovanou větou a obsahovat odrážky s pomlčkou.', 'error'),
('R7', 'Formát obsahu předmětu', 'Obsah předmětu musí obsahovat odrážky s pomlčkou.', 'error'),
('R8', 'Základní literatura', 'Literatura musí obsahovat alespoň jednu základní položku.', 'error'),
('R9', 'Jazyk literatury vzhledem k jazyku výuky', 'Pokud jazyk výuky = angličtina, literatura by měla být anglicky (jinak varování).', 'warning'),
('R10', 'Vyplnění sylabu v obou jazycích', 'Sylabus musí být vyplněn v obou jazycích (název i textové sekce).', 'error'),
('R11', 'Použití termínu předmět místo kurz', 'V definovaných sekcích se má používat slovo „předmět“, ne „kurz“.', 'recommendation'),
('R12', 'Konzistence anglických odrážek', 'Anglické odrážky musí mít konzistentní kapitalizaci a interpunkci.', 'recommendation')
ON CONFLICT ("code") DO NOTHING;
