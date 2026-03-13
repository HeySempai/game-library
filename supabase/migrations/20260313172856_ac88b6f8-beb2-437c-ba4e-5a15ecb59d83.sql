CREATE POLICY "Allow public upload covers"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Allow public update covers"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'covers')
WITH CHECK (bucket_id = 'covers');