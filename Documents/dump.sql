-- --------------------------------------------------------
-- Gazdagép:                     127.0.0.1
-- Szerver verzió:               12.2.2-MariaDB - MariaDB Server
-- Szerver OS:                   Win64
-- HeidiSQL Verzió:              12.15.0.7171
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Adatbázis struktúra mentése a nexora.
CREATE DATABASE IF NOT EXISTS `nexora` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;
USE `nexora`;

-- Struktúra mentése tábla nexora. felhasznalok
CREATE TABLE IF NOT EXISTS `felhasznalok` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(50) NOT NULL,
  `jelszo_hash` text NOT NULL,
  `nev` varchar(50) NOT NULL,
  `letrehozva` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `felhasznalok_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Az adatok exportálása nem lett kiválasztva.

-- Struktúra mentése tábla nexora. jatekok
CREATE TABLE IF NOT EXISTS `jatekok` (
  `jatek_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `termek_id` int(10) unsigned NOT NULL,
  `platform` varchar(50) NOT NULL,
  `mufaj` varchar(50) NOT NULL,
  `megjelenesi_datum` datetime NOT NULL,
  PRIMARY KEY (`jatek_id`),
  KEY `FK_jatekok_termekek` (`termek_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Az adatok exportálása nem lett kiválasztva.

-- Struktúra mentése tábla nexora. kapcsolatfelvetel
CREATE TABLE IF NOT EXISTS `kapcsolatfelvetel` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `Nev` varchar(50) NOT NULL,
  `Email` varchar(50) NOT NULL,
  `Uzenet` text NOT NULL,
  `Kuldve` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Az adatok exportálása nem lett kiválasztva.

-- Struktúra mentése tábla nexora. rendeles_tetel
CREATE TABLE IF NOT EXISTS `rendeles_tetel` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rendeles_id` int(10) unsigned NOT NULL,
  `termek_nev` varchar(255) NOT NULL,
  `termek_kategoria` varchar(50) NOT NULL,
  `egysegar` decimal(10,2) NOT NULL,
  `mennyiseg` int(10) unsigned NOT NULL DEFAULT 1,
  `aktivacios_kulcs` varchar(255) DEFAULT NULL,
  `kulcs_elkuldve` tinyint(1) NOT NULL DEFAULT 0,
  `aktivalt` tinyint(1) NOT NULL DEFAULT 0,
  `aktivalt_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_rendeles_tetel_rendelesek` (`rendeles_id`),
  CONSTRAINT `rendeles_tetel_rendeles_id_fkey` FOREIGN KEY (`rendeles_id`) REFERENCES `rendelesek` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Az adatok exportálása nem lett kiválasztva.

-- Struktúra mentése tábla nexora. rendelesek
CREATE TABLE IF NOT EXISTS `rendelesek` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `felhasznalo_id` int(10) unsigned NOT NULL,
  `vegosszeg` decimal(10,2) NOT NULL,
  `rendszerhaszn_dij` decimal(10,2) NOT NULL DEFAULT 990.00,
  `fizetesi_mod` varchar(50) NOT NULL,
  `allapot` varchar(50) NOT NULL DEFAULT 'feldolgozas_alatt',
  `rendelve` timestamp NOT NULL DEFAULT current_timestamp(),
  `teljesitve_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_rendelesek_felhasznalok` (`felhasznalo_id`),
  CONSTRAINT `rendelesek_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `felhasznalok` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Az adatok exportálása nem lett kiválasztva.

-- Struktúra mentése tábla nexora. szamlazasi_adatok
CREATE TABLE IF NOT EXISTS `szamlazasi_adatok` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rendeles_id` int(10) unsigned NOT NULL,
  `nev` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telefonszam` varchar(20) NOT NULL,
  `orszag` varchar(50) NOT NULL DEFAULT 'Magyarország',
  `varos` varchar(50) NOT NULL,
  `iranyitoszam` varchar(10) NOT NULL,
  `utca_hazszam` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `szamlazasi_adatok_rendeles_id_key` (`rendeles_id`),
  KEY `FK_szamlazas_rendelesek` (`rendeles_id`),
  CONSTRAINT `szamlazasi_adatok_rendeles_id_fkey` FOREIGN KEY (`rendeles_id`) REFERENCES `rendelesek` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Az adatok exportálása nem lett kiválasztva.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
