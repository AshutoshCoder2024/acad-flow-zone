
-- READ: any authenticated user can read from these buckets
CREATE POLICY "Authed read notice-attachments" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'notice-attachments');
CREATE POLICY "Authed read resources" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'resources');
CREATE POLICY "Authed read gallery" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'gallery');
CREATE POLICY "Authed read avatars" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'avatars');

-- WRITE: teachers/admins upload to content buckets
CREATE POLICY "Staff upload notice-attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'notice-attachments'
    AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin'))
  );
CREATE POLICY "Staff upload resources" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'resources'
    AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin'))
  );
CREATE POLICY "Staff upload gallery" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'gallery'
    AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin'))
  );
CREATE POLICY "Staff delete notice-attachments" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'notice-attachments'
    AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin'))
  );
CREATE POLICY "Staff delete resources" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'resources'
    AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin'))
  );
CREATE POLICY "Staff delete gallery" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'gallery'
    AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin'))
  );

-- AVATARS: users manage their own (folder = user id)
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );
