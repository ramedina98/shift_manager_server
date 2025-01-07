-- CreateTable
CREATE TABLE `users` (
    `id_user` VARCHAR(191) NOT NULL,
    `nombre1` VARCHAR(191) NOT NULL,
    `nombre2` VARCHAR(191) NOT NULL,
    `apellido1` VARCHAR(191) NOT NULL,
    `apellido2` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `user_name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `foto` LONGBLOB NOT NULL,
    `type` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_user_name_key`(`user_name`),
    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultorio` (
    `id_consultorio` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_consultorio` INTEGER NOT NULL,

    PRIMARY KEY (`id_consultorio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asignacion_consultorio` (
    `id_asignacion` VARCHAR(191) NOT NULL,
    `id_doc` VARCHAR(191) NOT NULL,
    `num_consultorio` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_asignacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consulta` (
    `id_consulta` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_paciente` VARCHAR(191) NOT NULL,
    `apellido_paciente` VARCHAR(191) NOT NULL,
    `tipo_paciente` VARCHAR(191) NOT NULL,
    `turno` VARCHAR(191) NOT NULL,
    `citado` BOOLEAN NOT NULL,
    `activo` BOOLEAN NOT NULL,
    `create_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_consulta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `citados` (
    `id_cita` VARCHAR(191) NOT NULL,
    `id_consulta` INTEGER NOT NULL,
    `id_doc` VARCHAR(191) NOT NULL,
    `hora_cita` DATETIME(3) NOT NULL,
    `create_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `citados_id_consulta_key`(`id_consulta`),
    PRIMARY KEY (`id_cita`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asignacion` (
    `id_asignacion` VARCHAR(191) NOT NULL,
    `id_consulta` INTEGER NOT NULL,
    `id_doc` VARCHAR(191) NOT NULL,
    `create_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_asignacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporte` (
    `id_reporte` INTEGER NOT NULL AUTO_INCREMENT,
    `consultorio` INTEGER NOT NULL,
    `turno` VARCHAR(191) NOT NULL,
    `nombre_paciente` VARCHAR(191) NOT NULL,
    `doctor` VARCHAR(191) NOT NULL,
    `visita` VARCHAR(191) NOT NULL,
    `fecha_hora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_reporte`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revoked_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` TEXT NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `revoked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` VARCHAR(191) NOT NULL,
    `token` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
