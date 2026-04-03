INSERT INTO "public"."customers" ("id", "name", "email", "phone_number", "created_at", "updated_at") VALUES
(1769, 'MUHAMMAD PRADIPA PARIBAWA', 'Kikibudi.prayitno@gmail.com', '6281224507342', '2026-03-30 08:10:28.417397+00', '2026-03-30 08:10:28.417397+00');

INSERT INTO "public"."discounts" ("id", "code", "description", "discount_type", "value", "valid_until", "created_at", "updated_at", "minimum_amount", "max_discount_amount", "usage_limit", "usage_count", "is_active") VALUES
(8, 'THM50RB', 'Khusus THM', 'fixed_amount', 50000.00, '2025-07-26 23:59:00+00', '2025-07-17 05:09:02.225616+00', '2025-07-21 03:31:57.565538+00', 200000.00, 0.00, 100, 0, 't');

INSERT INTO "public"."event_custom_field_options" ("id", "custom_field_id", "option_value", "option_label", "sort_order") VALUES
(155, 90, 'grade_11', 'Grade 11', 8);

INSERT INTO "public"."event_custom_fields" ("id", "event_id", "field_name", "field_label", "field_type", "is_required", "sort_order", "created_at", "updated_at") VALUES
(90, 6, 'grade', 'Grade', 'dropdown', 'f', 2, '2026-04-02 10:10:48.811516+00', '2026-04-02 10:10:48.811516+00');

INSERT INTO "public"."events" ("id", "name", "start_date", "end_date", "location", "created_at", "updated_at", "slug", "image_url", "description") VALUES
(3, 'Kreativa English Competition', '2026-02-14 08:00:00+00', '2026-02-14 12:00:00+00', 'Kreativa Global School, Jl. Soekarno-Hatta No.729, Kota Bandung', '2025-12-29 08:03:03.873797+00', '2026-01-26 08:29:03.377831+00', 'kreativa-english-competition', 'https://9vkfruvumlwqqco7.public.blob.vercel-storage.com/events/images/1767596768857-o80j5n3o6zq.jpeg', 'Kreativa English Competition is an English competition for Kindergarten, Primary, and Secondary students, featuring Show & Tell, Reading Contest, and English Olympics to help participants express ideas, explore language skills, and excel in English while building confidence, fluency, and communication skills. More Than a Competition!
* Children’s Psychologist Consultation Voucher • English Placement Test • Quick IQ Test • Bazaar • Relax & Play Corner'),
(5, 'SASMO COMPETITION 2026', '2026-04-18 08:00:00+00', '2026-03-30 23:59:00+00', 'Kreativa Global School, Jl. Soekarno-Hatta No.729, Kota Bandung', '2026-02-25 06:17:53.863314+00', '2026-04-02 09:54:23.654092+00', 'sasmo-competition-2026', 'https://9vkfruvumlwqqco7.public.blob.vercel-storage.com/events/images/1772176956390-pfsnnksx68k.jpeg', '<p><strong>SASMO 2026 Registration is OPEN at Kreativa Global School<br></strong>Kreativa Global School is officially opening registration for the <span><strong>Singapore and Asian Schools Math Olympiad (SASMO) 2026</strong></span>.<br><strong><br></strong>SASMO is one of Southeast Asia’s leading Mathematics Olympiads, designed to challenge students’ mathematical thinking and open pathways to higher-level international competitions.</p><p><span><strong>For Grades:</strong> 1–12<br><strong>Competition Pathway:</strong></span> SASMO → SIMOC → IJMO</p><p><strong>Competition Details<br></strong>Date: Saturday, 18 April 2026<br>Time: 08.00 WIB - End&nbsp;<br>Location: <strong>Kreativa Global School<br></strong>Jalan Soekarno Hatta No. 729</p><p></p><p><span><strong>Registration Fee:</strong> Rp 550.000 per student</span><u><br></u>Official Website: <a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 underline cursor-pointer" href="https://simcc.org/contest/sasmo/"><span>https://simcc.org/contest/sasmo/</span></a></p><p></p><p><span><strong>Registration closes on 11 March 2026.<br></strong></span>For registration and inquiries, please contact:<br>Agung Ridwansyah: +62 851-7412-0319</p><p></p><p><span><strong>NOTES:</strong> PLEASE FILL IN THE FORM BELOW IN CAPITAL LETTERS AND MAKE SURE TO RECHECK THE CORRECT NAME THAT WILL BE PUT IN THE CERTIFICATE.</span></p>'),
(6, 'Vanda International Junior Science Olympiad 2026', '2026-05-16 08:00:00+00', '2026-05-16 11:00:00+00', 'Kreativa Global School, Jl. Soekarno-Hatta No.729, Kota Bandung', '2026-04-02 06:48:24.704521+00', '2026-04-02 10:10:48.693197+00', 'vanda-international-junior-science-olympiad-2026', 'https://9vkfruvumlwqqco7.public.blob.vercel-storage.com/events/images/1775123916679-0ozfn2znx6u.jpeg', '<p><strong>Vanda International Junior Science Olympiad (VIJSO) 2026</strong> Registration is OPEN at Kreativa Global School</p><p>Kreativa Global School is officially opening registration for the VANDA International Junior Science Olympiad (VIJSO) 2026.</p><p>VANDA is a prestigious international science competition held annually around the globe. It focuses on the students’ ability to think critically and creatively to solve problems, while sparking their curiosity in the world of science.</p><p></p><p><strong>For Grades</strong>: 3–11</p><p><strong>Competition Pathway</strong>: VANDA → VANDA Global Finals → IJSO</p><p><strong>Competition Details</strong></p><p>-<strong> Date</strong>: Saturday, 16 May 2026</p><p>- <strong>Time</strong>: 08.00 WIB – End</p><p>- <strong>Location</strong>: <strong>Kreativa Global School</strong>. Jalan Soekarno Hatta No. 729</p><p>- <strong>Registration Fee</strong>: Rp 550.000 per student</p><p>- <strong>Official Website</strong>: <a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 underline cursor-pointer" href="https://vanda.simcc.org/">https://vanda.simcc.org/</a></p><p>- <strong>Registration closes on 24 April 2026.</strong></p><p></p><p>For registration and inquiries, please contact:</p><p>Mr. Agung : <strong>+62 815-3333-0340</strong></p><p></p><p><strong>NOTES</strong>: PLEASE FILL IN THE FORM BELOW IN CAPITAL LETTERS AND MAKE SURE TO RECHECK THE CORRECT NAME THAT WILL BE PUT IN THE CERTIFICATE.</p>');

INSERT INTO "public"."notification_logs" ("id", "order_reference", "channel", "trigger_on", "recipient_email", "recipient_phone", "request_payload", "response_payload", "created_at", "updated_at", "body") VALUES
(441, 'TKT1774850390227338', 'whatsapp', 'paid', NULL, '6289620960514', '{"to": "6289620960514", "body": "Hore, *Nunung Nurohmah*! 🎉\n\nPembayaran untuk pesanan *TKT1774850390227338* telah berhasil kami terima.\n\nE-tiket Anda untuk acara *SASMO COMPETITION 2026* sudah siap! Silakan unduh melalui tautan berikut:\nhttps://event.kreativaglobal.id/payment/TKT1774850390227338\n\nSampai jumpa di lokasi!", "messageType": "text"}', '{"data": {"message_id": 262865752}, "message": "Success sent message", "success": true}', '2026-03-30 09:29:22.561939+00', '2026-03-30 09:29:22.561939+00', 'Hore, *Nunung Nurohmah*! 🎉

Pembayaran untuk pesanan *TKT1774850390227338* telah berhasil kami terima.

E-tiket Anda untuk acara *SASMO COMPETITION 2026* sudah siap! Silakan unduh melalui tautan berikut:
https://event.kreativaglobal.id/payment/TKT1774850390227338

Sampai jumpa di lokasi!'),
(438, 'TKT1774858226228007', 'whatsapp', 'checkout', NULL, '6281224507342', '{"message": "Halo, *MUHAMMAD PRADIPA PARIBAWA* 👋\n\nTerima kasih atas partisipasinya telah memesan tiket *SASMO COMPETITION 2026*!\n\n*Nomor Pesanan:* TKT1774858226228007\n*Total Tagihan:* *Rp 550.329*\n\nSegera selesaikan pembayaran Anda sebelum *Senin, 30 Maret 2026 jam 20.10.28 WIB*.\n\n*Metode Pembayaran:*\n*QRIS*\n\nNomor Virtual Account/Nomor Rekening(jika Bank Transfer/QRIS Statis): *qris*\n\nklik disini untuk petunjuk pembayaran : https://event.kreativaglobal.id/payment/TKT1774858226228007 \n\njika link tidak bisa diklik silakan save dulu nomor ini\n\nTerima kasih!"}', '{"data": {"message_id": 262859615}, "message": "Success sent message", "success": true}', '2026-03-30 08:10:32.652+00', '2026-03-30 08:10:32.774699+00', NULL);

INSERT INTO "public"."notification_templates" ("id", "name", "channel", "trigger_on", "subject", "body", "is_active", "created_at", "updated_at") VALUES
(1, 'Email - Checkout', 'email', 'checkout', 'Instruksi Pembayaran untuk Pesanan {{order_reference}}', '<h1>Segera Selesaikan Pembayaran Anda</h1><p>Halo <strong>{{customer.name}}</strong>,</p><p>Terima kasih telah melakukan pemesanan untuk acara <strong>{{event.name}}</strong> dengan nomor referensi <strong>{{</strong>order.order_reference}}</p><p>Total tagihan Anda adalah: <strong>Rp {{order.final_amount}}</strong>.</p><p>Mohon selesaikan pembayaran sebelum <strong>{{payment_deadline}}</strong> melalui metode berikut:</p><hr><p><strong>{{payment_channel.pg_name}}</strong></p><p>Nomor Virtual Account: <strong>{{virtual_account_number}}</strong></p><p><strong>Instruksi Pembayaran:</strong> {{payment_response_url}}</p><hr><p>Pesanan akan otomatis dibatalkan jika pembayaran tidak diterima sebelum batas waktu.</p><p>Terima kasih!!</p>', 't', '2025-07-13 18:37:13.135251+00', '2026-01-25 06:18:08.996253+00'),
(2, 'WhatsApp - Checkout', 'whatsapp', 'checkout', NULL, 'Halo, *{{customer.name}}* 👋

Terima kasih atas partisipasinya telah memesan tiket *{{event.name}}*!

*Nomor Pesanan:* {{order.order_reference}}
*Total Tagihan:* *{{order.final_amount}}*

Segera selesaikan pembayaran Anda sebelum *{{payment_deadline}}*.

*Metode Pembayaran:*
*{{payment_channel.pg_name}}*

Nomor Virtual Account/Nomor Rekening(jika Bank Transfer/QRIS Statis): *{{virtual_account_number}}*

klik disini untuk petunjuk pembayaran : {{payment_response_url}} 

jika link tidak bisa diklik silakan save dulu nomor ini

Terima kasih!', 't', '2025-07-13 18:37:13.135251+00', '2025-07-21 18:29:43.599658+00'),
(3, 'Email - Paid', 'email', 'paid', 'Pembayaran Berhasil! E-Tiket Anda untuk Pesanan {{order_reference}}', '<h1>Pembayaran Berhasil!</h1>
  <p>Halo <strong>{{customer_name}}</strong>,</p>
  <p>Kami telah menerima pembayaran Anda untuk pesanan <strong>{{order_reference}}</strong>.</p>
  <p>E-tiket Anda untuk acara <strong>{{event_name}}</strong> telah diterbitkan dan terlampir dalam email ini. Anda juga bisa mengunduhnya melalui tautan berikut: {{ticket_link}}</p>
  <p>Cukup tunjukkan QR code pada e-tiket Anda saat akan masuk ke lokasi acara.</p>
  <p>Sampai jumpa di acara!</p>', 't', '2025-07-13 18:37:13.135251+00', '2025-07-13 18:37:13.135251+00'),
(4, 'WhatsApp - Paid', 'whatsapp', 'paid', NULL, 'Hore, *{{customer.name}}*! 🎉

Pembayaran untuk pesanan *{{order.order_reference}}* telah berhasil kami terima.

E-tiket Anda untuk acara *{{event.name}}* sudah siap! Silakan unduh melalui tautan berikut:
{{ticket_link}}

Sampai jumpa di lokasi!', 't', '2025-07-13 18:37:13.135251+00', '2025-07-18 00:11:57.86306+00'),
(6, 'WhatsApp - Reminder', 'whatsapp', 'reminder', 'WA Reminder', '<p>Halo, *{{customer_name}}*! 🤩 Acara *{{event_name}}* akan segera tiba! Kami sudah tidak sabar untuk menyambut Anda. 🗓 Detail Acara Anda: *Tanggal:* {{event_date}} *Lokasi:* {{event_location}} Untuk mempermudah proses check-in, pastikan Anda sudah menyiapkan e-tiket Anda. Anda bisa melihat dan mengunduhnya kapan saja melalui tautan aman di bawah ini: 👇 {{ticket_link}} Sampai jumpa di lokasi! 👋 Terima Kasih.</p>', 't', '2025-07-23 19:42:05.139225+00', '2026-01-26 04:58:43.614909+00');

INSERT INTO "public"."order_item_attendees" ("id", "order_item_id", "attendee_name", "attendee_email", "attendee_phone_number", "custom_answers", "ticket_id", "created_at", "barcode_id") VALUES
(2202, 2377, 'Dikha Wirayudha', 'rharha.fitriani1@gmail.com', '089525747955', '{"4": "MI Al Azhar Rancaekek", "5": "5"}', 2580, '2026-01-10 03:54:30.768692+00', NULL),
(2203, 2378, 'Nadiem Shaquille Abdullah', 'assyifarofiqoh05@gmail.com', '085773311588', '{"4": "Sekolah Arvardia", "5": "Kindergarten "}', 2587, '2026-01-10 04:24:14.600367+00', NULL);

INSERT INTO "public"."order_items" ("id", "order_id", "ticket_type_id", "quantity", "price_per_ticket", "created_at", "effective_ticket_count") VALUES
(2547, 2844, 11, 1, 550000.00, '2026-03-30 08:10:29.629149+00', 1),
(2546, 2843, 11, 2, 550000.00, '2026-03-30 05:59:52.4714+00', 2);

INSERT INTO "public"."orders" ("id", "order_reference", "virtual_account_number", "payment_response_url", "customer_id", "event_id", "payment_channel_id", "discount_id", "order_date", "gross_amount", "discount_amount", "final_amount", "status", "paid_at", "is_email_checkout", "is_wa_checkout", "is_email_paid", "is_wa_paid", "created_at", "updated_at", "unique_code", "proof_transfer") VALUES
(2838, 'TKT1774753260860166', '8830835802496766', 'https://web.faspay.co.id/pws/100003/2830000010100000/e2b68381540f2c9952ddc9f688f398acda0391f2?trx_id=8830835802496766&merchant_id=35802&bill_no=TKT1774753260860166', 1765, 5, 3, NULL, '2026-03-29 03:01:02.678285+00', 550000.00, 0.00, 550000.00, 'paid', '2026-03-29 10:02:31+00', 'f', 'f', 'f', 'f', '2026-03-29 03:01:02.678285+00', '2026-03-29 03:02:35.049+00', NULL, NULL),
(2837, 'TKT1774752005867987', 'qris', 'https://event.kreativaglobal.id/payment/TKT1774752005867987', 1764, 5, 17, NULL, '2026-03-29 02:40:07.629066+00', 550000.00, 0.00, 550267.00, 'paid', NULL, 'f', 'f', 'f', 'f', '2026-03-29 02:40:07.629066+00', '2026-03-29 07:22:32.137891+00', 267, 'https://9vkfruvumlwqqco7.public.blob.vercel-storage.com/IMG_7694.jpeg');

INSERT INTO "public"."orders_temp" ("id", "upload_session_id", "row_number", "customer_name", "customer_email", "customer_phone_number", "event_id", "ticket_type_id", "quantity", "final_amount", "order_date", "payment_channel_id", "import_status", "error_message", "created_at", "updated_at", "barcode_id", "custom_answers") VALUES
(3813, '650bc7fe-9e40-4db1-9392-b1fe3f13c51e', 648, 'Critoper grasio', 'critoper_grasio27118@gmail.com', '628204657931', 2, 3, 1, 100000.00, '2025-09-14 00:00:00+00', 1, 'success', NULL, '2025-09-21 21:26:44.260137+00', '2025-09-21 21:26:44.260137+00', NULL, '{"size": "L", "register_via": "pelajar", "jenis_kelamin": "Laki-laki"}'),
(3812, '650bc7fe-9e40-4db1-9392-b1fe3f13c51e', 647, 'Daud andrean sitompul', 'daud_andrean_sitompul46703@gmail.com', '628717440965', 2, 3, 1, 100000.00, '2025-09-14 00:00:00+00', 1, 'success', NULL, '2025-09-21 21:26:44.231787+00', '2025-09-21 21:26:44.231787+00', NULL, '{"size": "XL", "register_via": "pelajar", "jenis_kelamin": "Laki-laki"}');

INSERT INTO "public"."payment_channels" ("pg_code", "pg_name", "image_url", "is_active", "created_at", "updated_at", "is_redirect", "vendor", "category", "id", "sort_order", "image_qris") VALUES
('801', 'BNI VA', 'https://placehold.co/100x50/005E5D/FFFFFF?text=BNI', 't', '2025-07-15 20:42:51.371794+00', '2025-09-14 15:11:57.396297+00', 'f', 'faspay', 'va', 1, 9, NULL),
('800', 'BRI VA', 'https://placehold.co/100x50/00529C/FFFFFF?text=BRI', 't', '2025-07-15 20:42:51.371794+00', '2025-09-14 15:11:57.428623+00', 'f', 'faspay', 'va', 2, 10, NULL);

INSERT INTO "public"."payment_instructions" ("id", "title", "description", "created_at", "updated_at", "step_order", "payment_channel_id") VALUES
(1, 'Pembayaran melalui ATM Mandiri', '<ol><li>Catat kode pembayaran yang anda dapat.</li><li>Gunakan ATM Mandiri untuk menyelesaikan pembayaran.</li><li>Masukkan PIN anda.</li><li>Pilih ''''BAYAR/BELI''''.</li><li>Pilih LAINNYA.</li><li>Cari pilihan MULTI PAYMENT.</li><li>Masukkan kode perusahaan 88558.</li><li>Masukkan kode VIRTUAL ACCOUNT.</li><li>Masukkan atau Pastikan Jumlah Pembayaran sesuai dengan Jumlah Tagihan anda kemudian tekan ''''Benar''''.</li><li>Pilih Tagihan Anda jika sudah sesuai tekan YA.</li><li>Konfirmasikan tagihan anda apakah sudah sesuai lalu tekan YA.</li><li>Harap Simpan Struk Transaksi yang anda dapatkan.</li></ol>', '2025-07-15 20:42:51.371794+00', '2025-07-16 01:26:29.32147+00', 2, 3),
(2, 'Pembayaran dengan Livin by Mandiri', '<ol><li>Login Mandiri Online dengan memasukkan USERNAME dan PASSWORD.</li><li>Pilih menu PEMBAYARAN.</li><li>Pilih menu MULTI PAYMENT.</li><li>Cari Penyedia Jasa ''''Media Indonusa''''.</li><li>Masukkan NOMOR VIRTUAL ACCOUNT dan cek nominal yang akan dibayarkan, lalu pilih Lanjut.</li><li>Setelah muncul tagihan, pilih KONFIRMASI.</li><li>Masukkan PIN/ CHALLENGE CODE TOKEN.</li><li>Transaksi selesai, simpan bukti bayar anda.</li></ol>', '2025-07-15 20:42:51.371794+00', '2025-07-16 01:26:29.212318+00', 1, 3);

INSERT INTO "public"."payment_logs" ("id", "order_reference", "virtual_account_number", "log_type", "request_payload", "response_payload", "created_at", "updated_at", "payment_response_url") VALUES
(303, 'TKT1774753260860166', '8830835802496766', 'callback', '{"q": "/apid/faspaycallback", "trx_id": "8830835802496766", "bill_no": "TKT1774753260860166", "request": "Payment Notification", "merchant": "Indonesia Juara", "signature": "ae1fd78063776696e1b0908d26c0b0e06347a706", "bill_total": "550000", "merchant_id": "35802", "payment_date": "2026-03-29 10:02:31", "payment_reff": "2733656170329100229849", "payment_total": "550000", "payment_channel": "Mandiri Virtual Account", "payment_channel_uid": "802", "payment_status_code": "2", "payment_status_desc": "Payment Sukses"}', NULL, '2026-03-29 03:02:35.778+00', '2026-03-29 03:02:36.345836+00', NULL),
(299, 'TKT1774591681899824', '8830835802859137', 'callback', '{"q": "/apid/faspaycallback", "trx_id": "8830835802859137", "bill_no": "TKT1774591681899824", "request": "Payment Notification", "merchant": "Indonesia Juara", "signature": "a3fe8c9476cbec2d80cabf0049338d377e39a403", "bill_total": "550000", "merchant_id": "35802", "payment_date": "2026-03-27 13:10:38", "payment_reff": "7916630960327131037487", "payment_total": "550000", "payment_channel": "Mandiri Virtual Account", "payment_channel_uid": "802", "payment_status_code": "2", "payment_status_desc": "Payment Sukses"}', NULL, '2026-03-27 06:10:42.647+00', '2026-03-27 06:10:43.23259+00', NULL),
(298, 'TKT1774591681899824', '8830835802859137', 'checkout', NULL, NULL, '2026-03-27 06:08:06.428+00', '2026-03-27 06:08:06.539154+00', NULL);

INSERT INTO "public"."settings" ("id", "key", "value", "type", "category", "description", "created_at", "updated_at") VALUES
(1, 'app_logo', 'https://9vkfruvumlwqqco7.public.blob.vercel-storage.com/app_logo_1758532220037.png', 'file', 'branding', 'Main application logo', '2025-09-22 02:47:40.628663', '2025-09-22 09:10:22.027494'),
(2, 'app_favicon', 'https://9vkfruvumlwqqco7.public.blob.vercel-storage.com/app_logo_1758532220037.png', 'file', 'branding', 'Application favicon', '2025-09-22 02:47:40.628663', '2026-01-18 13:49:00.791658'),
(3, 'sidebar_primary_color', '#6b34c1', 'color', 'appearance', 'Primary sidebar color', '2025-09-22 02:47:40.628663', '2025-09-22 07:39:36.683299'),
(4, 'sidebar_secondary_color', '#ef64a4', 'color', 'appearance', 'Secondary sidebar color', '2025-09-22 02:47:40.628663', '2025-09-22 07:40:12.312109'),
(5, 'app_name', 'Kreativa Super Apps Admins', 'string', 'general', 'Application name', '2025-09-22 02:47:40.628663', '2026-01-23 10:02:23.400532'),
(6, 'app_description', 'Kreativa Super Apps Admin description', 'string', 'general', 'Application description', '2025-09-22 02:47:40.628663', '2026-01-23 10:02:02.020233');

INSERT INTO "public"."ticket_custom_field_answers" ("id", "ticket_id", "custom_field_id", "answer_value", "created_at") VALUES
(6572, 2620, 6, 'SD Asy-syifa 1 Bandung', '2026-01-27 06:28:49.603173+00'),
(6573, 2620, 7, 'primary_4_kelas_4', '2026-01-27 06:28:49.603173+00'),
(6574, 2621, 6, 'TK Islam Mutiara Hati', '2026-01-27 08:04:16.385294+00');

INSERT INTO "public"."ticket_types" ("id", "event_id", "name", "price", "quantity_total", "created_at", "updated_at", "quantity_sold", "tickets_per_purchase") VALUES
(1, 1, 'Global Prenting Summit - Couple', 300000.00, 100, '2025-07-15 06:46:44.08185+00', '2025-09-16 07:25:53.236403+00', 14, 2),
(2, 1, 'Global Parenting Summit - Personal', 150000.00, 100, '2025-07-15 06:46:44.08185+00', '2025-09-16 07:25:59.471487+00', 19, 1),
(5, 3, 'English Olympics Competition', 150000.00, 41, '2025-12-29 08:03:50.305536+00', '2026-02-13 08:27:43.187861+00', 41, 1),
(6, 4, 'Primary School Ticket', 0.00, 30, '2025-08-26 09:59:23.642062+00', '2025-08-27 06:51:16.420186+00', 0, 1),
(7, 4, 'Kindergarten Ticket', 0.00, 50, '2025-08-26 09:59:45.847757+00', '2025-08-27 06:51:09.206182+00', 0, 1),
(8, 3, 'Reading Contest Competition', 150000.00, 46, '2025-12-29 08:04:27.268135+00', '2026-02-03 04:47:37.288808+00', 46, 1),
(10, 3, 'Storytelling Competition', 150000.00, 40, '2025-12-29 08:05:16.323873+00', '2026-02-08 08:24:18.959413+00', 40, 1),
(11, 5, 'Registration Fee', 550000.00, 55, '2026-02-25 06:19:57.028025+00', '2026-03-30 08:57:22.207915+00', 55, 1),
(12, 6, 'Registration Fee', 550000.00, 100, '2026-04-02 06:57:15.009028+00', '2026-04-02 06:57:15.009028+00', 0, 1);

INSERT INTO "public"."tickets" ("id", "order_id", "ticket_type_id", "ticket_code", "attendee_name", "attendee_email", "is_checked_in", "checked_in_at", "created_at", "updated_at", "attendee_phone_number") VALUES
(2742, 2843, 11, '9AEYLN4J', 'SAFIYA NAFILA SAPUTRA', 'safiya.nafila@gmail.com', 'f', NULL, '2026-03-30 09:29:20.889876+00', '2026-03-30 09:29:20.889876+00', '085875198821'),
(2741, 2843, 11, 'JAHET6OK', 'AQILA FELISHA ARDININGRUM', 'aqila.felisha@sekolahjuara.sch.id', 'f', NULL, '2026-03-30 09:29:20.889876+00', '2026-03-30 09:29:20.889876+00', '088973517319');

INSERT INTO "public"."users" ("id", "name", "email", "email_verified", "image", "role", "created_at", "updated_at") VALUES
(2, 'Dev IJF', 'dev@indonesiajuara.id', NULL, NULL, 'superadmin', '2026-01-06 09:46:38.999', '2026-01-06 09:46:38.999'),
(3, 'irvan', 'irvan@cnt.id', NULL, NULL, 'superadmin', '2026-01-06 10:12:41.445', '2026-01-06 09:46:38.999');