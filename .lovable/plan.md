Update the `profiles` table so Shirley P.'s record is associated with Lake Washington High School, matching the other published profiles.

## Change
- Set `school_id = '53a48fc7-a6aa-4475-a398-77d6ee7bed05'` on the row where `slug = 'shirley-p'`.

## Verification
- Re-run `SELECT slug, name, school_id FROM profiles ORDER BY name;` to confirm Shirley P. now shows the same school ID as the other profiles.