-- Migration 002: learning paths (mundos) + playable game missions.
-- Pedagogy: Piaget stages per age band, Vygotsky ZPD via difficulty,
-- CRA for math, phonological awareness for reading, CASEL for social-emotional.

CREATE TABLE paths (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug     TEXT NOT NULL UNIQUE,
  name     TEXT NOT NULL,
  emoji    TEXT NOT NULL,
  tagline  TEXT NOT NULL,
  pedagogy TEXT NOT NULL,          -- foundation this world trains
  sort     INT NOT NULL DEFAULT 0
);

ALTER TABLE missions
  ADD COLUMN path_id UUID REFERENCES paths(id),
  ADD COLUMN game_type TEXT NOT NULL DEFAULT 'tap',   -- count-tap | memory-pairs | pattern | math-blocks | word-builder | heart-scenarios
  ADD COLUMN difficulty INT NOT NULL DEFAULT 1,        -- 1..3 within band (ZPD ladder)
  ADD COLUMN config JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN sort INT NOT NULL DEFAULT 0;

ALTER TABLE mission_completions
  ADD COLUMN accuracy INT;                             -- 0..100, for cognitive reports

INSERT INTO paths (slug, name, emoji, tagline, pedagogy, sort) VALUES
 ('numeros',  'Mundo Números',  '🔢', 'Contar, sumar y pensar con cantidades', 'Método CRA: concreto, representacional, abstracto', 1),
 ('palabras', 'Mundo Palabras', '📚', 'Sílabas, palabras e historias', 'Conciencia fonológica y comprensión lectora', 2),
 ('logica',   'Mundo Lógica',   '🧩', 'Patrones, memoria y razonamiento', 'Funciones ejecutivas: memoria de trabajo y flexibilidad', 3),
 ('corazon',  'Mundo Corazón',  '💛', 'Emociones, familia y amistad', 'Marco CASEL de aprendizaje socioemocional', 4);

-- Wipe placeholder missions, seed real playable ones.
DELETE FROM mission_completions;
DELETE FROM missions;

WITH p AS (SELECT slug, id FROM paths)
INSERT INTO missions (slug, title, category, age_band, gems_reward, stars_reward, path_id, game_type, difficulty, config, sort) VALUES
-- ============ EARLY (1-4, preoperational: one-to-one correspondence, subitizing) ============
 ('cuenta-animales-3', 'Cuenta los animalitos', 'math', 'early', 10, 1,
   (SELECT id FROM p WHERE slug='numeros'), 'count-tap', 1,
   '{"rounds":4,"max":3,"items":["🐰","🦆","🐢","🐟"]}', 1),
 ('cuenta-frutas-5', 'La canasta de frutas', 'math', 'early', 12, 1,
   (SELECT id FROM p WHERE slug='numeros'), 'count-tap', 2,
   '{"rounds":4,"max":5,"items":["🍎","🍌","🍓","🍊"]}', 2),
 ('memoria-granja', 'Parejas de la granja', 'logic', 'early', 10, 1,
   (SELECT id FROM p WHERE slug='logica'), 'memory-pairs', 1,
   '{"pairs":3,"emojis":["🐮","🐷","🐔","🐴","🐑","🐐"]}', 1),
 ('patron-colores', '¿Qué sigue?', 'logic', 'early', 12, 1,
   (SELECT id FROM p WHERE slug='logica'), 'pattern', 1,
   '{"rounds":4,"kind":"AB","tokens":["🔴","🔵","🟡","🟢"]}', 2),
 ('caritas-emociones', '¿Cómo se siente?', 'habits', 'early', 12, 1,
   (SELECT id FROM p WHERE slug='corazon'), 'heart-scenarios', 1,
   '{"scenarios":[
     {"text":"Tu amiga se cayó y llora. ¿Qué carita tiene?","options":[{"text":"😢 Triste","good":true,"feedback":"¡Sí! Está triste. Podemos abrazarla."},{"text":"😄 Feliz","good":false,"feedback":"Mira sus lágrimas... está triste. ¡Vamos a ayudarla!"}]},
     {"text":"Papá te lee un cuento antes de dormir. ¿Cómo te sientes?","options":[{"text":"😊 Contento","good":true,"feedback":"¡Los cuentos con papá son lo mejor!"},{"text":"😠 Enojado","good":false,"feedback":"Leer con papá es tiempo feliz en familia."}]},
     {"text":"Tu hermano comparte su juguete contigo. ¿Qué haces?","options":[{"text":"Decir gracias","good":true,"feedback":"¡Gracias hace felices a todos!"},{"text":"Quitárselo","good":false,"feedback":"Mejor decimos gracias cuando comparten con nosotros."}]}
   ]}', 1),
 ('sonidos-animales', 'Primeras palabras', 'reading', 'early', 10, 1,
   (SELECT id FROM p WHERE slug='palabras'), 'word-builder', 1,
   '{"words":[{"word":"OSO","syllables":["O","SO"],"emoji":"🐻"},{"word":"PATO","syllables":["PA","TO"],"emoji":"🦆"},{"word":"GATO","syllables":["GA","TO"],"emoji":"🐱"}]}', 1),

-- ============ MIDDLE (5-7, concrete operational entry: addition, syllables, sequencing) ============
 ('sumas-visuales-10', 'Sumas con bloques', 'math', 'middle', 15, 1,
   (SELECT id FROM p WHERE slug='numeros'), 'math-blocks', 1,
   '{"rounds":5,"op":"add","max":10}', 1),
 ('restas-visuales-10', 'Restas mágicas', 'math', 'middle', 15, 1,
   (SELECT id FROM p WHERE slug='numeros'), 'math-blocks', 2,
   '{"rounds":5,"op":"sub","max":10}', 2),
 ('memoria-oceano', 'Memoria del océano', 'logic', 'middle', 15, 1,
   (SELECT id FROM p WHERE slug='logica'), 'memory-pairs', 2,
   '{"pairs":6,"emojis":["🐙","🦀","🐠","🐬","🦈","🐚","🦞","🐡"]}', 1),
 ('patron-abc', 'Detective de patrones', 'logic', 'middle', 15, 2,
   (SELECT id FROM p WHERE slug='logica'), 'pattern', 2,
   '{"rounds":5,"kind":"ABC","tokens":["⭐","🌙","☀️","☁️","🌈"]}', 2),
 ('silabas-2', 'Constructor de palabras', 'reading', 'middle', 15, 2,
   (SELECT id FROM p WHERE slug='palabras'), 'word-builder', 1,
   '{"words":[{"word":"CASA","syllables":["CA","SA"],"emoji":"🏠"},{"word":"LUNA","syllables":["LU","NA"],"emoji":"🌙"},{"word":"MESA","syllables":["ME","SA"],"emoji":"🪑"},{"word":"PELOTA","syllables":["PE","LO","TA"],"emoji":"⚽"}]}', 1),
 ('valores-companeros', 'Amigos de verdad', 'habits', 'middle', 15, 2,
   (SELECT id FROM p WHERE slug='corazon'), 'heart-scenarios', 2,
   '{"scenarios":[
     {"text":"Un niño nuevo llega a tu clase y no conoce a nadie. ¿Qué haces?","options":[{"text":"Lo invito a jugar","good":true,"feedback":"¡Eso es ser buen amigo! Así nadie se queda solo."},{"text":"Lo ignoro","good":false,"feedback":"Imagina cómo se siente él. Invitarlo a jugar lo haría muy feliz."},{"text":"Espero a que él hable","good":false,"feedback":"A veces el nuevo tiene pena. ¡Tú puedes dar el primer paso!"}]},
     {"text":"Rompiste sin querer el dibujo de tu hermana. ¿Qué haces?","options":[{"text":"Le digo la verdad y pido perdón","good":true,"feedback":"Decir la verdad es de valientes. ¡Bien hecho!"},{"text":"Escondo el dibujo","good":false,"feedback":"Esconder las cosas las hace peores. La verdad siempre es mejor camino."}]},
     {"text":"Ganaste el juego y tu amigo perdió y está triste. ¿Qué le dices?","options":[{"text":"Jugaste muy bien, ¿otra vez?","good":true,"feedback":"¡Eso es juego limpio! Ganar con humildad hace mejores amigos."},{"text":"¡Soy mejor que tú!","good":false,"feedback":"Presumir lastima. Un buen ganador anima a los demás."}]}
   ]}', 1),

-- ============ UPPER (8-11, concrete operational: multiplication, comprehension, complex SEL) ============
 ('multiplicacion-tablas', 'Misión multiplicación', 'math', 'upper', 25, 2,
   (SELECT id FROM p WHERE slug='numeros'), 'math-blocks', 1,
   '{"rounds":6,"op":"mul","max":10}', 1),
 ('sumas-grandes', 'Sumas de dos cifras', 'math', 'upper', 20, 2,
   (SELECT id FROM p WHERE slug='numeros'), 'math-blocks', 2,
   '{"rounds":6,"op":"add","max":50}', 2),
 ('memoria-espacio', 'Memoria galáctica', 'logic', 'upper', 20, 2,
   (SELECT id FROM p WHERE slug='logica'), 'memory-pairs', 3,
   '{"pairs":8,"emojis":["🚀","🛸","🪐","☄️","🌌","👽","🛰️","🌠","🌕","⭐"]}', 1),
 ('patron-numerico', 'Series numéricas', 'logic', 'upper', 25, 2,
   (SELECT id FROM p WHERE slug='logica'), 'pattern', 3,
   '{"rounds":5,"kind":"numeric"}', 2),
 ('palabras-largas', 'Palabras gigantes', 'reading', 'upper', 20, 2,
   (SELECT id FROM p WHERE slug='palabras'), 'word-builder', 2,
   '{"words":[{"word":"MARIPOSA","syllables":["MA","RI","PO","SA"],"emoji":"🦋"},{"word":"ELEFANTE","syllables":["E","LE","FAN","TE"],"emoji":"🐘"},{"word":"BIBLIOTECA","syllables":["BI","BLIO","TE","CA"],"emoji":"📖"},{"word":"DINOSAURIO","syllables":["DI","NO","SAU","RIO"],"emoji":"🦕"}]}', 1),
 ('dilemas-familia', 'Decisiones del corazón', 'habits', 'upper', 25, 3,
   (SELECT id FROM p WHERE slug='corazon'), 'heart-scenarios', 3,
   '{"scenarios":[
     {"text":"Tus amigos se burlan de un compañero en el chat del grupo. ¿Qué haces?","options":[{"text":"Digo que no está bien y aviso a un adulto","good":true,"feedback":"Defender a otros requiere valor. Eso es integridad."},{"text":"Me río con ellos","good":false,"feedback":"Reírse también lastima. Tú puedes ser quien cambie la situación."},{"text":"No digo nada","good":false,"feedback":"El silencio deja solo al que sufre. Un mensaje tuyo puede cambiarlo todo."}]},
     {"text":"La abuela te cuenta la misma historia por tercera vez. ¿Qué haces?","options":[{"text":"La escucho con cariño","good":true,"feedback":"Escuchar a los abuelos es un regalo que les das. Sus historias son tesoros."},{"text":"Le digo que ya me la contó","good":false,"feedback":"Para ella contarte es importante. Escucharla la hace feliz."}]},
     {"text":"Encuentras dinero en el patio de la escuela. ¿Qué haces?","options":[{"text":"Lo entrego a la maestra","good":true,"feedback":"Honestidad aunque nadie te vea: eso define quién eres."},{"text":"Me lo quedo","good":false,"feedback":"Alguien lo está buscando. Devolverlo es lo que te gustaría que hicieran por ti."}]},
     {"text":"Tu mejor amigo sacó mejor calificación que tú. ¿Cómo reaccionas?","options":[{"text":"Lo felicito y le pido que estudiemos juntos","good":true,"feedback":"¡Mentalidad de crecimiento! Su éxito puede impulsarte, no frenarte."},{"text":"Me enojo con él","good":false,"feedback":"Su logro no te quita nada. Juntos pueden crecer más."}]}
   ]}', 1);
