-- Run ONCE in MySQL Workbench on a database created earlier
USE roamoffline;
ALTER TABLE tourist_places ADD COLUMN osm_id VARCHAR(30) NULL, ADD UNIQUE KEY uq_osm_id (osm_id);
-- remove the old sample places (they have no osm_id)
DELETE FROM tourist_places WHERE osm_id IS NULL;
