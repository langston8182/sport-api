# 🏋️ Système de Suivi des Poids d'Exercice

## Vue d'ensemble

Ce système permet de suivre les poids portés pour chaque exercice dans une session d'entraînement. Il remplace le système de notes précédent et est conçu spécifiquement pour les exercices ayant le mode `"reps"`.

## Fonctionnalités

- ✅ **Validation automatique** : Seuls les exercices avec `mode: "reps"` peuvent avoir des poids enregistrés
- ✅ **Suivi par série** : Enregistrer le poids pour chaque série (set) d'un exercice
- ✅ **Historique complet** : Voir l'évolution des poids dans le temps
- ✅ **Statistiques de progression** : Poids maximum, dernière session, nombre de sessions total
- ✅ **APIs REST complètes** : CRUD complet pour gérer les poids d'exercice

## Structure des Données

### Exercise Weight
```json
{
  "_id": "ObjectId",
  "exerciseId": "string", // ID de l'exercice
  "sessionId": "string",  // ID de la session
  "weight": 80.5,         // Poids en nombre décimal
  "unit": "kg",           // Unité (kg par défaut)
  "setNumber": 1,         // Numéro de la série (1, 2, 3...)
  "reps": 12,             // Nombre de répétitions effectuées
  "createdAt": "ISO Date",
  "updatedAt": "ISO Date"
}
```

## APIs Disponibles

### Créer un poids d'exercice
```http
POST /exercise-weights
Content-Type: application/json

{
  "exerciseId": "670f1a1e123456789abcdef0",
  "sessionId": "670f1a1e123456789abcdef1",
  "weight": 80.5,
  "unit": "kg",
  "setNumber": 1,
  "reps": 12
}
```

### Lister les poids par exercice (progression)
```http
GET /exercise-weights?exerciseId=670f1a1e123456789abcdef0
```

### Lister les poids par session
```http
GET /exercise-weights?sessionId=670f1a1e123456789abcdef1
```

### Récupérer un poids spécifique
```http
GET /exercise-weights/670f1a1e123456789abcdef2
```

### Mettre à jour un poids
```http
PATCH /exercise-weights/670f1a1e123456789abcdef2
Content-Type: application/json

{
  "weight": 82.5,
  "reps": 10
}
```

### Supprimer un poids
```http
DELETE /exercise-weights/670f1a1e123456789abcdef2
```

### Statistiques de progression
```http
GET /exercises/670f1a1e123456789abcdef0/progression
```

Retourne :
```json
{
  "exerciseId": "670f1a1e123456789abcdef0",
  "totalSessions": 5,
  "maxWeight": 85.0,
  "latestWeight": 82.5,
  "progression": [
    {
      "sessionId": "session1",
      "date": "2025-10-16T10:00:00.000Z",
      "maxWeight": 80.0,
      "totalSets": 3,
      "weights": [...]
    }
  ]
}
```

## Validation

- ✅ `exerciseId` requis et doit exister
- ✅ L'exercice doit avoir `mode: "reps"`
- ✅ `sessionId` requis
- ✅ `weight` requis et > 0
- ✅ `reps` requis et > 0
- ✅ `unit` optionnel (défaut: "kg")
- ✅ `setNumber` optionnel (défaut: 1)

## Exemples d'usage

### Scénario typique : Suivi d'une séance de développé couché

1. **Créer l'exercice**
```bash
curl -X POST /exercises -d '{
  "name": "Développé couché",
  "mode": "reps",
  "imageUrl": "https://example.com/bench.jpg"
}'
```

2. **Créer la session**
```bash
curl -X POST /sessions -d '{
  "name": "Séance Pectoraux",
  "items": [{"order": 1, "exerciseId": "EX_ID", "sets": 3, "reps": 12, "restSec": 90}]
}'
```

3. **Enregistrer les poids pour chaque série**
```bash
# Série 1
curl -X POST /exercise-weights -d '{
  "exerciseId": "EX_ID", "sessionId": "SESSION_ID",
  "weight": 80.0, "setNumber": 1, "reps": 12
}'

# Série 2  
curl -X POST /exercise-weights -d '{
  "exerciseId": "EX_ID", "sessionId": "SESSION_ID", 
  "weight": 82.5, "setNumber": 2, "reps": 10
}'

# Série 3
curl -X POST /exercise-weights -d '{
  "exerciseId": "EX_ID", "sessionId": "SESSION_ID",
  "weight": 85.0, "setNumber": 3, "reps": 8  
}'
```

4. **Consulter la progression**
```bash
curl -X GET /exercises/EX_ID/progression
```

## Architecture

```
├── models/exercise-weights.model.mjs     # Accès données MongoDB
├── services/exercise-weights.service.mjs # Logique métier + validation
├── controllers/exercise-weights.controller.mjs # API REST
└── tests/
    ├── events/exercise-weights/          # Tests d'événements API Gateway
    └── integration/models.exercise-weights.db.test.mjs # Tests d'intégration
```

## Migration

Cette fonctionnalité **ajoute** un nouveau système de suivi des poids sans modifier l'existant. Aucune migration n'est nécessaire.

- ✅ Les sessions existantes continuent de fonctionner
- ✅ Les exercices existants ne sont pas affectés
- ✅ Nouvelle collection `exercise_weights` créée automatiquement