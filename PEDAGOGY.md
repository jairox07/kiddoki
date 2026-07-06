# Fundamentos pedagógicos de Kiddoki

Cada mundo, misión y mecánica está anclada a técnicas con evidencia. Este documento es la referencia para diseño de contenido nuevo y para due diligence de inversionistas.

## Bandas de edad = etapas de desarrollo (Piaget)

| Banda | Edad | Etapa | Qué puede aprender jugando |
|-------|------|-------|---------------------------|
| early | 1-4 | Preoperacional | Correspondencia uno a uno, subitización (≤5), emociones básicas, primeras sílabas |
| middle | 5-7 | Entrada a operaciones concretas | Suma/resta con apoyo visual, sílabas complejas, patrones ABC, escenarios sociales simples |
| upper | 8-11 | Operaciones concretas | Multiplicación, series numéricas, palabras multisílabas, dilemas morales con matices |

## Los 4 mundos y su base científica

1. **Mundo Números** — método CRA (Concreto → Representacional → Abstracto): toda operación se muestra primero con bloques visuales antes que símbolos. Estándar en educación matemática especial y general (Singapur Math lo popularizó).
2. **Mundo Palabras** — conciencia fonológica: armar palabras por sílabas es el predictor más robusto de éxito lector temprano (National Reading Panel). En español, la sílaba es la unidad natural.
3. **Mundo Lógica** — funciones ejecutivas: memoria de trabajo (parejas), flexibilidad cognitiva (patrones), control inhibitorio (esperar el turno correcto en sílabas). Center on the Developing Child (Harvard) las señala como mejor predictor de éxito académico que el IQ.
4. **Mundo Corazón** — marco CASEL de aprendizaje socioemocional: autoconciencia, autogestión, conciencia social, habilidades de relación y toma de decisiones responsable. Los escenarios cubren familia (escuchar a los abuelos), honestidad, empatía, juego limpio y valentía ante el bullying.

## Mecánicas transversales

- **ZDP (Vygotsky)**: cada mundo escala dificultad 1→3 dentro de la banda (puntos ●●○ visibles). El niño siempre juega en el borde de lo que domina.
- **Growth mindset (Dweck)**: el feedback elogia esfuerzo y estrategia, nunca "eres listo". Errores reciben explicación amable, jamás castigo. Completar con <70% de precisión aún da gemas (la mitad): el esfuerzo siempre paga.
- **Refuerzo positivo sin dark patterns**: no hay vidas, corazones que se agotan, timers de presión ni loot boxes. La racha diaria expira suave (48h) y no se pierde progreso.
- **Repetición espaciada**: las misiones se pueden rejugar cada día ("done_today" se reinicia a medianoche); el mejor puntaje queda registrado para el reporte parental.
- **Anti-pantalla-pasiva**: cero video autoplay, cero scroll infinito. Toda interacción exige respuesta cognitiva activa. Esto es lo que sustituye a YouTube: mismo dopamine loop de "logro", cero consumo pasivo.

## Reglas para contenido nuevo

1. Toda misión declara su `game_type`, banda, dificultad y mundo. El config es JSONB: contenido nuevo = fila nueva en `missions`, sin tocar código.
2. Escenarios del corazón: siempre ≥1 opción buena, feedback de las malas explica el porqué sin avergonzar, temas rotan entre familia, amistad, honestidad y manejo de emociones.
3. Nada de contenido con marca, personajes licenciados o referencias a redes sociales.
4. Español neutro latinoamericano; frases cortas para lectores emergentes.
