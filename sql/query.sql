-- name: CheckUserExists :one
SELECT EXISTS(SELECT 1 FROM "user" WHERE firebase_id = $1);

-- name: CreateUser :one
INSERT INTO  "user" (firebase_id) values ($1)
RETURNING *;

-- name: FindUserByFirebaseId :one
SELECT id, firebase_id, created_at from "user" where firebase_id = $1;

-- name: FindProjectsByUserId :many
Select id, name, description, permission, is_user_default_project, created_at from project p inner join user_project up on p.id = up.project_id where up.user_id = $1;

-- name: CreateProject :one
INSERT INTO project (name, description)  values ($1, $2)
RETURNING *;

-- name: CreateUserProject :one
INSERT INTO user_project (user_id, project_id, permission, is_user_default_project) values ($1, $2, $3, $4)
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM "user" where firebase_id = $1;

-- name: DeleteUserProject :exec
DELETE FROM "user_project" WHERE project_id = $1;

-- name: DeleteProject :exec
DELETE FROM "project" WHERE id = $1;
