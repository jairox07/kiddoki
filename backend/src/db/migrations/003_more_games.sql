-- Migration 003: age-adapted content expansion.
-- New game types: sort-classify (Piaget categorization) and story-quiz
-- (active reading comprehension, the direct YouTube substitute).
-- Apply with: docker cp + psql -f (never pipe through PowerShell).

WITH p AS (SELECT slug, id FROM paths)
INSERT INTO missions (slug, title, category, age_band, gems_reward, stars_reward, path_id, game_type, difficulty, config, sort) VALUES

-- ============ EARLY (1-4): perception, categories, family feelings ============
 ('clasifica-colores', 'Cada cosa a su color', 'logic', 'early', 12, 1,
   (SELECT id FROM p WHERE slug='logica'), 'sort-classify', 2,
   '{"prompt":"¿De qué color es?","groups":[{"label":"Rojo","emoji":"🔴"},{"label":"Amarillo","emoji":"🟡"},{"label":"Verde","emoji":"🟢"}],
     "items":[{"emoji":"🍎","group":"Rojo"},{"emoji":"🍌","group":"Amarillo"},{"emoji":"🐸","group":"Verde"},{"emoji":"🍓","group":"Rojo"},{"emoji":"🌻","group":"Amarillo"},{"emoji":"🥦","group":"Verde"}]}', 3),
 ('animales-casa-granja', '¿Dónde vive?', 'logic', 'early', 12, 1,
   (SELECT id FROM p WHERE slug='logica'), 'sort-classify', 2,
   '{"prompt":"¿Dónde vive este amiguito?","groups":[{"label":"En casa","emoji":"🏠"},{"label":"En la granja","emoji":"🚜"}],
     "items":[{"emoji":"🐶","group":"En casa"},{"emoji":"🐮","group":"En la granja"},{"emoji":"🐱","group":"En casa"},{"emoji":"🐷","group":"En la granja"},{"emoji":"🐹","group":"En casa"},{"emoji":"🐔","group":"En la granja"}]}', 4),
 ('patron-formas', 'Baile de formas', 'logic', 'early', 12, 1,
   (SELECT id FROM p WHERE slug='logica'), 'pattern', 2,
   '{"rounds":4,"kind":"AB","tokens":["⬛","🔺","⚫","⬜"]}', 5),
 ('familia-carinos', 'Momentos en familia', 'habits', 'early', 12, 1,
   (SELECT id FROM p WHERE slug='corazon'), 'heart-scenarios', 2,
   '{"scenarios":[
     {"text":"Mamá llega cansada del trabajo. ¿Qué puedes hacer?","options":[{"text":"Darle un abrazo","good":true,"feedback":"¡Tu abrazo es magia para mamá!"},{"text":"Gritar fuerte","good":false,"feedback":"Mamá necesita cariño. Un abrazo la hace sonreír."}]},
     {"text":"Es hora de guardar los juguetes. ¿Qué haces?","options":[{"text":"Los guardo yo solito","good":true,"feedback":"¡Guardar tus juguetes es de niños grandes!"},{"text":"Los dejo tirados","good":false,"feedback":"Si los guardas, mañana los encuentras facilito."}]},
     {"text":"Tu hermanito quiere jugar contigo. ¿Qué haces?","options":[{"text":"Jugamos juntos","good":true,"feedback":"¡Jugar juntos es doble diversión!"},{"text":"Le digo que no","good":false,"feedback":"Con tu hermanito los juegos son más divertidos."}]}
   ]}', 2),

-- ============ MIDDLE (5-7): habitats, first stories, family cooperation, skip counting ============
 ('habitats-animales', 'Tierra, mar y aire', 'logic', 'middle', 15, 2,
   (SELECT id FROM p WHERE slug='logica'), 'sort-classify', 2,
   '{"prompt":"¿Dónde vive?","groups":[{"label":"Tierra","emoji":"🌳"},{"label":"Mar","emoji":"🌊"},{"label":"Aire","emoji":"☁️"}],
     "items":[{"emoji":"🦁","group":"Tierra"},{"emoji":"🐬","group":"Mar"},{"emoji":"🦅","group":"Aire"},{"emoji":"🐘","group":"Tierra"},{"emoji":"🐙","group":"Mar"},{"emoji":"🦋","group":"Aire"},{"emoji":"🐢","group":"Tierra"},{"emoji":"🦈","group":"Mar"}]}', 3),
 ('cuento-tortuga', 'El cuento de Tuga', 'reading', 'middle', 18, 2,
   (SELECT id FROM p WHERE slug='palabras'), 'story-quiz', 2,
   '{"emoji":"🐢","story":"Tuga la tortuga quería llegar al lago. Sus amigos le decían que era muy lenta. Tuga no se rindió: caminó y caminó todos los días un poquito. Al final llegó al lago y todos la aplaudieron.",
     "questions":[
       {"q":"¿A dónde quería llegar Tuga?","options":[{"text":"Al lago","good":true},{"text":"A la montaña","good":false},{"text":"A su casa","good":false}]},
       {"q":"¿Qué hizo Tuga cuando le dijeron que era lenta?","options":[{"text":"No se rindió y siguió caminando","good":true},{"text":"Se puso a llorar","good":false},{"text":"Se quedó dormida","good":false}]},
       {"q":"¿Qué nos enseña Tuga?","options":[{"text":"Que con constancia llegas a tu meta","good":true},{"text":"Que hay que correr rápido","good":false}]}
     ]}', 2),
 ('familia-equipo', 'Mi familia es mi equipo', 'habits', 'middle', 15, 2,
   (SELECT id FROM p WHERE slug='corazon'), 'heart-scenarios', 2,
   '{"scenarios":[
     {"text":"Papá está cocinando la cena. ¿Cómo puedes ayudar?","options":[{"text":"Pongo la mesa","good":true,"feedback":"¡En equipo todo sale mejor! La familia es el primer equipo."},{"text":"Me voy a jugar","good":false,"feedback":"Ayudar en casa hace que todos tengan más tiempo para jugar juntos."}]},
     {"text":"Tu abuelo no sabe usar el teléfono nuevo. ¿Qué haces?","options":[{"text":"Le enseño con paciencia","good":true,"feedback":"Enseñar con paciencia es un regalo. ¡Él te enseñó muchas cosas a ti!"},{"text":"Me río de él","good":false,"feedback":"Todos aprendemos cosas nuevas. La paciencia es amor."}]},
     {"text":"Perdiste en el juego de mesa familiar. ¿Qué haces?","options":[{"text":"Felicito al ganador y pido revancha","good":true,"feedback":"¡Saber perder es de campeones!"},{"text":"Tiro el tablero","good":false,"feedback":"Perder es parte de jugar. La próxima puede ser tuya."}]}
   ]}', 2),
 ('saltos-de-numeros', 'Saltos de canguro', 'math', 'middle', 15, 2,
   (SELECT id FROM p WHERE slug='numeros'), 'pattern', 3,
   '{"rounds":5,"kind":"numeric"}', 3),

-- ============ UPPER (8-11): division, ecology values, inference reading, gratitude ============
 ('division-justa', 'Reparto justo', 'math', 'upper', 25, 2,
   (SELECT id FROM p WHERE slug='numeros'), 'math-blocks', 3,
   '{"rounds":6,"op":"div","max":10}', 3),
 ('recicla-y-gana', 'Guardianes del planeta', 'habits', 'upper', 20, 2,
   (SELECT id FROM p WHERE slug='corazon'), 'sort-classify', 2,
   '{"prompt":"¿A qué bote va?","groups":[{"label":"Orgánico","emoji":"🍃"},{"label":"Papel","emoji":"📄"},{"label":"Plástico","emoji":"♻️"}],
     "items":[{"emoji":"🍌","group":"Orgánico"},{"emoji":"📰","group":"Papel"},{"emoji":"🧴","group":"Plástico"},{"emoji":"🍎","group":"Orgánico"},{"emoji":"📦","group":"Papel"},{"emoji":"🥤","group":"Plástico"},{"emoji":"🥚","group":"Orgánico"},{"emoji":"📖","group":"Papel"}]}', 2),
 ('cuento-inventora', 'La inventora del pueblo', 'reading', 'upper', 25, 3,
   (SELECT id FROM p WHERE slug='palabras'), 'story-quiz', 2,
   '{"emoji":"🔧","story":"En un pueblo sin luz vivía Sofía, una niña que amaba desarmar cosas. Los vecinos decían que perdía el tiempo. Un día, con piezas de bicicletas viejas y un molino roto, construyó una máquina que daba luz a la plaza. Esa noche, el pueblo entero leyó bajo su lámpara. Los vecinos ya no dicen que pierde el tiempo: ahora le llevan sus piezas viejas.",
     "questions":[
       {"q":"¿Qué construyó Sofía?","options":[{"text":"Una máquina que daba luz","good":true},{"text":"Una bicicleta nueva","good":false},{"text":"Un molino de agua","good":false}]},
       {"q":"¿Por qué los vecinos le llevan ahora sus piezas viejas?","options":[{"text":"Porque ahora confían en su talento","good":true},{"text":"Porque quieren tirar basura","good":false},{"text":"Porque ella los obliga","good":false}]},
       {"q":"¿Qué aprendemos de esta historia?","options":[{"text":"Lo que otros llaman perder el tiempo puede ser tu don","good":true},{"text":"Desarmar cosas es malo","good":false}]}
     ]}', 2),
 ('diario-gratitud', 'El poder de dar gracias', 'habits', 'upper', 20, 2,
   (SELECT id FROM p WHERE slug='corazon'), 'heart-scenarios', 2,
   '{"scenarios":[
     {"text":"Antes de dormir, piensas en tu día. ¿Qué es dar gracias?","options":[{"text":"Notar lo bueno que ya tengo","good":true,"feedback":"¡Exacto! La gratitud entrena a tu cerebro para ver lo bueno."},{"text":"Pedir más cosas","good":false,"feedback":"Dar gracias es mirar lo que ya tienes: familia, amigos, tu casa."}]},
     {"text":"Tu mamá te preparó tu comida favorita. ¿Qué haces?","options":[{"text":"Le agradezco y le digo que me encantó","good":true,"feedback":"Un gracias sincero alegra el corazón de quien te cuida."},{"text":"Como sin decir nada","good":false,"feedback":"Ella lo hizo con amor. Decirle gracias la hace muy feliz."}]},
     {"text":"Hoy tuviste un día difícil en la escuela. ¿Puedes dar gracias igual?","options":[{"text":"Sí, siempre hay algo bueno que encontrar","good":true,"feedback":"Los días difíciles también traen aprendizajes. Encontrarlos te hace fuerte."},{"text":"No, hoy todo estuvo mal","good":false,"feedback":"Hasta en días grises hay chispas: un amigo, un recreo, tu familia esperándote."}]}
   ]}', 3);
