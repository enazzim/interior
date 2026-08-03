-- ==========================================================
-- Interior ERP - Master Database Seed Script (data.sql)
-- DB에 데이터가 전혀 없을 때만 1회 실행되는 기초 마스터 시드 쿼리
-- ==========================================================

-- 1. 기초 회사 마스터 데이터 (ID=1)
INSERT INTO companies (company_id, company_name, business_number, address, subscription_plan, tel, fax, business_type, business_item, ceo_name, created_at)
VALUES (1, '프로데브 인테리어', '123-45-67890', '서울시 강남구 테헤란로 123', 'PREMIUM', '02-555-1234', '02-555-5678', '서비스 / 건설', '실내건축 / 인테리어 디자인', '이해동', CURRENT_TIMESTAMP);

-- 2. 초기 관리자 계정 (admin / 1234 - BCrypt 해시 적용)
INSERT INTO users (user_id, company_id, login_id, username, password, role, created_at)
VALUES (1, 1, 'admin', '관리자', '1234', 'ADMIN', CURRENT_TIMESTAMP);

-- 3. 초기 기본 거래처 마스터 데이터 (발주처 및 자재상)
INSERT INTO vendors (vendor_id, company_id, vendor_name, vendor_type, business_type, created_at)
VALUES (1, 1, '김철수 고객님', 'CLIENT', 'INDIVIDUAL', CURRENT_TIMESTAMP);

INSERT INTO vendors (vendor_id, company_id, vendor_name, vendor_type, business_type, created_at)
VALUES (2, 1, '을지로 타일나라', 'SUPPLIER', 'CORPORATION', CURRENT_TIMESTAMP);

INSERT INTO vendors (vendor_id, company_id, vendor_name, vendor_type, business_type, created_at)
VALUES (3, 1, '한샘 자재상사', 'SUPPLIER', 'CORPORATION', CURRENT_TIMESTAMP);

INSERT INTO vendors (vendor_id, company_id, vendor_name, vendor_type, business_type, created_at)
VALUES (4, 1, '개나리 벽지', 'SUPPLIER', 'CORPORATION', CURRENT_TIMESTAMP);

-- 4. 공정 대분류 마스터 데이터
INSERT INTO processes (process_id, process_name, sort_order)
VALUES (1, '타일공사', 1);

INSERT INTO processes (process_id, process_name, sort_order)
VALUES (2, '도배공사', 2);

-- 5. 자재 및 노무 마스터 단가표 데이터
INSERT INTO materials (material_id, company_id, process_id, material_name, standard_unit, distribution_unit, conversion_rate, purchase_price, labor_price, specification, item_type)
VALUES (1, 1, 1, '고급 이태리 포세린 타일 (600x600)', '㎡', 'Box', 1.44, 35000, 0, '600x600', 'MATERIAL');

INSERT INTO materials (material_id, company_id, process_id, material_name, standard_unit, distribution_unit, conversion_rate, purchase_price, labor_price, specification, item_type)
VALUES (2, 1, 2, 'LG 하우시스 실크 벽지', '㎡', 'Roll', 16.5, 40000, 0, '실크', 'MATERIAL');

INSERT INTO materials (material_id, company_id, process_id, material_name, standard_unit, distribution_unit, conversion_rate, purchase_price, labor_price, specification, item_type)
VALUES (3, 1, 1, '타일공 시공 인건비', '일', '일', 1.0, 0, 250000, '기공 1인 기준 (식대 포함)', 'LABOR');

INSERT INTO materials (material_id, company_id, process_id, material_name, standard_unit, distribution_unit, conversion_rate, purchase_price, labor_price, specification, item_type)
VALUES (4, 1, 2, '도배공 시공 인건비', '일', '일', 1.0, 0, 220000, '기공 1인 기준', 'LABOR');
