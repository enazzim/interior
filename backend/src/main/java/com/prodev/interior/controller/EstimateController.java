package com.prodev.interior.controller;

import com.prodev.interior.dto.EstimateCreateRequest;
import com.prodev.interior.dto.EstimateResponse;
import com.prodev.interior.service.EstimateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.List;

@RestController
@RequestMapping("/api/estimates")
@RequiredArgsConstructor
public class EstimateController {

    private final EstimateService estimateService;

    @PostMapping
    public ResponseEntity<EstimateResponse> createEstimate(@RequestBody EstimateCreateRequest request) {
        EstimateResponse response = estimateService.createEstimate(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<EstimateResponse>> getEstimatesByProject(@PathVariable Long projectId) {
        List<EstimateResponse> responses = estimateService.getEstimatesByProject(projectId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{estimateId}")
    public ResponseEntity<EstimateResponse> getEstimateById(@PathVariable Long estimateId) {
        EstimateResponse response = estimateService.getEstimateById(estimateId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{estimateId}/excel")
    public ResponseEntity<byte[]> downloadEstimateExcel(@PathVariable Long estimateId) {
        try {
            EstimateResponse estimate = estimateService.getEstimateById(estimateId);
            
            try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
                org.apache.poi.xssf.usermodel.XSSFSheet sheet = workbook.createSheet("견적서");
                sheet.setDisplayGridlines(true); // 격자선 활성화

                // 인쇄 용지 세로 한 장에 맞춤
                sheet.setAutobreaks(true);
                org.apache.poi.xssf.usermodel.XSSFPrintSetup printSetup = sheet.getPrintSetup();
                printSetup.setPaperSize(org.apache.poi.xssf.usermodel.XSSFPrintSetup.A4_PAPERSIZE);
                printSetup.setLandscape(false);
                sheet.setFitToPage(true);
                printSetup.setFitWidth((short) 1);
                printSetup.setFitHeight((short) 1);

                // 폰트 설정
                org.apache.poi.xssf.usermodel.XSSFFont defaultFont = workbook.createFont();
                defaultFont.setFontName("맑은 고딕");
                defaultFont.setFontHeightInPoints((short) 9);

                org.apache.poi.xssf.usermodel.XSSFFont boldFont = workbook.createFont();
                boldFont.setFontName("맑은 고딕");
                boldFont.setFontHeightInPoints((short) 9);
                boldFont.setBold(true);

                // 스타일 설정
                org.apache.poi.xssf.usermodel.XSSFCellStyle borderStyle = workbook.createCellStyle();
                borderStyle.setFont(defaultFont);
                borderStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                borderStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                borderStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                borderStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                borderStyle.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);

                org.apache.poi.xssf.usermodel.XSSFCellStyle borderCenter = workbook.createCellStyle();
                borderCenter.cloneStyleFrom(borderStyle);
                borderCenter.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);

                org.apache.poi.xssf.usermodel.XSSFCellStyle borderRight = workbook.createCellStyle();
                borderRight.cloneStyleFrom(borderStyle);
                borderRight.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.RIGHT);

                org.apache.poi.xssf.usermodel.XSSFCellStyle borderRightNumeric = workbook.createCellStyle();
                borderRightNumeric.cloneStyleFrom(borderRight);
                borderRightNumeric.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));

                // 헤더 스타일 (연한 회색 배경)
                org.apache.poi.xssf.usermodel.XSSFCellStyle headerStyle = workbook.createCellStyle();
                headerStyle.cloneStyleFrom(borderCenter);
                headerStyle.setFont(boldFont);
                headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                headerStyle.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(new java.awt.Color(241, 245, 249), null));

                // 1행: NO. 와 타이틀
                org.apache.poi.xssf.usermodel.XSSFRow row1 = sheet.createRow(1); // 2행 (인덱스 1)
                row1.setHeightInPoints(35);
                org.apache.poi.xssf.usermodel.XSSFCell cellNo = row1.createCell(0);
                cellNo.setCellValue("NO. ");
                org.apache.poi.xssf.usermodel.XSSFCellStyle noStyle = workbook.createCellStyle();
                noStyle.setFont(defaultFont);
                noStyle.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.BOTTOM);
                cellNo.setCellStyle(noStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, 1));

                org.apache.poi.xssf.usermodel.XSSFCell cellTitle = row1.createCell(2);
                cellTitle.setCellValue("견   적   서");
                org.apache.poi.xssf.usermodel.XSSFCellStyle titleStyle = workbook.createCellStyle();
                org.apache.poi.xssf.usermodel.XSSFFont titleFont = workbook.createFont();
                titleFont.setFontName("맑은 고딕");
                titleFont.setFontHeightInPoints((short) 20);
                titleFont.setBold(true);
                titleStyle.setFont(titleFont);
                titleStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
                titleStyle.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
                cellTitle.setCellStyle(titleStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 2, 2, 5));

                // 3행 공백 및 공사정보 수급
                org.apache.poi.xssf.usermodel.XSSFRow row2 = sheet.createRow(2);
                row2.setHeightInPoints(15);

                // 4행: 날짜 기입
                org.apache.poi.xssf.usermodel.XSSFRow row4 = sheet.createRow(4); // 5행 (인덱스 4)
                row4.setHeightInPoints(22);
                org.apache.poi.xssf.usermodel.XSSFCell cellDate = row4.createCell(0);
                java.time.LocalDate cDate = estimate.getCreatedAt() != null ? estimate.getCreatedAt().toLocalDate() : java.time.LocalDate.now();
                cellDate.setCellValue(cDate.getYear() + " 년    " + cDate.getMonthValue() + " 월    " + cDate.getDayOfMonth() + " 일");
                cellDate.setCellStyle(borderCenter);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(4, 4, 0, 1));

                // 6행: 귀하 기입
                org.apache.poi.xssf.usermodel.XSSFRow row6 = sheet.createRow(6); // 7행 (인덱스 6)
                row6.setHeightInPoints(22);
                org.apache.poi.xssf.usermodel.XSSFCell cellClient = row6.createCell(0);
                String clientName = estimate.getClientVendorName() != null ? estimate.getClientVendorName() : "미지정 거래처";
                cellClient.setCellValue(clientName + " 귀하");
                org.apache.poi.xssf.usermodel.XSSFCellStyle clientStyle = workbook.createCellStyle();
                org.apache.poi.xssf.usermodel.XSSFFont clientFont = workbook.createFont();
                clientFont.setFontName("맑은 고딕");
                clientFont.setFontHeightInPoints((short) 11);
                clientFont.setBold(true);
                clientFont.setUnderline(org.apache.poi.ss.usermodel.FontUnderline.SINGLE);
                clientStyle.setFont(clientFont);
                clientStyle.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.BOTTOM);
                cellClient.setCellStyle(clientStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(6, 6, 0, 1));

                // 8행: 계산 안내 기입
                org.apache.poi.xssf.usermodel.XSSFRow row8 = sheet.createRow(8); // 9행 (인덱스 8)
                row8.setHeightInPoints(20);
                org.apache.poi.xssf.usermodel.XSSFCell cellCalc = row8.createCell(0);
                cellCalc.setCellValue("아래와 같이 계산합니다.");
                org.apache.poi.xssf.usermodel.XSSFCellStyle calcStyle = workbook.createCellStyle();
                calcStyle.setFont(defaultFont);
                calcStyle.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.BOTTOM);
                cellCalc.setCellStyle(calcStyle);

                // 공급자 박스 구성 (4~8행, C~F열 사용)
                // C열: 공급자 (세로 병합)
                org.apache.poi.xssf.usermodel.XSSFCellStyle supplierLabelStyle = workbook.createCellStyle();
                supplierLabelStyle.cloneStyleFrom(borderCenter);
                supplierLabelStyle.setFont(boldFont);
                supplierLabelStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                supplierLabelStyle.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(new java.awt.Color(241, 245, 249), null));

                for (int r = 4; r <= 8; r++) {
                    org.apache.poi.xssf.usermodel.XSSFRow rObj = sheet.getRow(r);
                    if (rObj == null) rObj = sheet.createRow(r);
                    rObj.setHeightInPoints(20);
                    org.apache.poi.xssf.usermodel.XSSFCell cC = rObj.createCell(2);
                    cC.setCellStyle(supplierLabelStyle);
                    if (r == 4) cC.setCellValue("공\n\n급\n\n자");
                }
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(4, 8, 2, 2));

                // 공급자 항목 채우기
                String compName = estimate.getCompanyName() != null ? estimate.getCompanyName() : "프로데브 인테리어";
                String compBizNo = estimate.getCompanyBusinessNumber() != null ? estimate.getCompanyBusinessNumber() : "123-45-67890";
                String compAddr = estimate.getCompanyAddress() != null ? estimate.getCompanyAddress() : "서울시 강남구 테헤란로 123";
                String compTel = estimate.getCompanyTel() != null ? estimate.getCompanyTel() : "02-555-1234";
                String compType = estimate.getCompanyBusinessType() != null ? estimate.getCompanyBusinessType() : "서비스/건설";
                String compItem = estimate.getCompanyBusinessItem() != null ? estimate.getCompanyBusinessItem() : "실내건축";
                String compCeo = estimate.getCompanyCeoName() != null ? estimate.getCompanyCeoName() : "이해동";

                // 4행 (등록번호)
                org.apache.poi.xssf.usermodel.XSSFRow r4 = sheet.getRow(4);
                org.apache.poi.xssf.usermodel.XSSFCell cD4 = r4.createCell(3);
                cD4.setCellValue("등록번호"); cD4.setCellStyle(supplierLabelStyle);
                org.apache.poi.xssf.usermodel.XSSFCell cE4 = r4.createCell(4);
                cE4.setCellValue(compBizNo); cE4.setCellStyle(borderCenter);
                r4.createCell(5).setCellStyle(borderCenter);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(4, 4, 4, 5));

                // 5행 (상호, 성명)
                org.apache.poi.xssf.usermodel.XSSFRow r5 = sheet.getRow(5);
                org.apache.poi.xssf.usermodel.XSSFCell cD5 = r5.createCell(3);
                cD5.setCellValue("상호(법인명)"); cD5.setCellStyle(supplierLabelStyle);
                org.apache.poi.xssf.usermodel.XSSFCell cE5 = r5.createCell(4);
                cE5.setCellValue(compName); cE5.setCellStyle(borderCenter);
                org.apache.poi.xssf.usermodel.XSSFCell cF5 = r5.createCell(5);
                cF5.setCellValue("성명  " + compCeo + "  (인)"); cF5.setCellStyle(borderCenter);

                // 6행 (사업장주소)
                org.apache.poi.xssf.usermodel.XSSFRow r6 = sheet.getRow(6);
                org.apache.poi.xssf.usermodel.XSSFCell cD6 = r6.createCell(3);
                cD6.setCellValue("사업장주소"); cD6.setCellStyle(supplierLabelStyle);
                org.apache.poi.xssf.usermodel.XSSFCell cE6 = r6.createCell(4);
                cE6.setCellValue(compAddr); cE6.setCellStyle(borderStyle);
                r6.createCell(5).setCellStyle(borderStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(6, 6, 4, 5));

                // 7행 (업태, 종목)
                org.apache.poi.xssf.usermodel.XSSFRow r7 = sheet.getRow(7);
                org.apache.poi.xssf.usermodel.XSSFCell cD7 = r7.createCell(3);
                cD7.setCellValue("업태"); cD7.setCellStyle(supplierLabelStyle);
                org.apache.poi.xssf.usermodel.XSSFCell cE7 = r7.createCell(4);
                cE7.setCellValue(compType); cE7.setCellStyle(borderCenter);
                org.apache.poi.xssf.usermodel.XSSFCell cF7 = r7.createCell(5);
                cF7.setCellValue("종목  " + compItem); cF7.setCellStyle(borderCenter);

                // 8행 (전화번호)
                org.apache.poi.xssf.usermodel.XSSFRow r8 = sheet.getRow(8);
                org.apache.poi.xssf.usermodel.XSSFCell cD8 = r8.createCell(3);
                cD8.setCellValue("전화번호"); cD8.setCellStyle(supplierLabelStyle);
                org.apache.poi.xssf.usermodel.XSSFCell cE8 = r8.createCell(4);
                cE8.setCellValue(compTel); cE8.setCellStyle(borderCenter);
                r8.createCell(5).setCellStyle(borderCenter);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(8, 8, 4, 5));


                // 10행: 합계금액 (A10~F10 병합)
                org.apache.poi.xssf.usermodel.XSSFRow row9 = sheet.createRow(9); // 10행
                row9.setHeightInPoints(30);
                org.apache.poi.xssf.usermodel.XSSFCell cellSum = row9.createCell(0);
                String koreanAmt = numToKorean(estimate.getTotalAmount());
                cellSum.setCellValue(" (공급가액+세액)    금  " + koreanAmt + "  ( ₩ " + String.format("%,d", estimate.getTotalAmount()) + " - )");
                
                org.apache.poi.xssf.usermodel.XSSFCellStyle sumStyle = workbook.createCellStyle();
                org.apache.poi.xssf.usermodel.XSSFFont sumFont = workbook.createFont();
                sumFont.setFontName("맑은 고딕");
                sumFont.setFontHeightInPoints((short) 10);
                sumFont.setBold(true);
                sumStyle.setFont(sumFont);
                sumStyle.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
                sumStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.MEDIUM);
                sumStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.MEDIUM);
                sumStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                sumStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                cellSum.setCellStyle(sumStyle);
                for (int i = 1; i < 6; i++) row9.createCell(i).setCellStyle(sumStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(9, 9, 0, 5));


                // 11행: 테이블 헤더
                org.apache.poi.xssf.usermodel.XSSFRow tblHeaderRow = sheet.createRow(10);
                tblHeaderRow.setHeightInPoints(24);
                String[] tableHeaders = {"품 명", "규 격", "수 량", "단 가", "공급가액", "세 액"};
                for (int i = 0; i < tableHeaders.length; i++) {
                    org.apache.poi.xssf.usermodel.XSSFCell cell = tblHeaderRow.createCell(i);
                    cell.setCellValue(tableHeaders[i]);
                    cell.setCellStyle(headerStyle);
                }

                // 12행~33행: 데이터 기입 및 빈칸 테두리 채우기 (총 22행 고정)
                int dataStartRow = 11;
                int maxDataRows = 22;
                long totalSupplyAmt = 0;
                long totalTaxAmt = 0;
                int itemsCount = estimate.getItems().size();

                for (int rIdx = 0; rIdx < maxDataRows; rIdx++) {
                    org.apache.poi.xssf.usermodel.XSSFRow row = sheet.createRow(dataStartRow + rIdx);
                    row.setHeightInPoints(22);

                    org.apache.poi.xssf.usermodel.XSSFCell c0 = row.createCell(0); c0.setCellStyle(borderStyle);
                    org.apache.poi.xssf.usermodel.XSSFCell c1 = row.createCell(1); c1.setCellStyle(borderCenter);
                    org.apache.poi.xssf.usermodel.XSSFCell c2 = row.createCell(2); c2.setCellStyle(borderRight);
                    org.apache.poi.xssf.usermodel.XSSFCell c3 = row.createCell(3); c3.setCellStyle(borderRight);
                    org.apache.poi.xssf.usermodel.XSSFCell c4 = row.createCell(4); c4.setCellStyle(borderRight);
                    org.apache.poi.xssf.usermodel.XSSFCell c5 = row.createCell(5); c5.setCellStyle(borderRight);

                    if (rIdx < itemsCount) {
                        EstimateResponse.EstimateItemResponse item = estimate.getItems().get(rIdx);
                        c2.setCellStyle(borderRightNumeric);
                        c3.setCellStyle(borderRightNumeric);
                        c4.setCellStyle(borderRightNumeric);
                        c5.setCellStyle(borderRightNumeric);
                        
                        // 품명
                        c0.setCellValue(item.getMaterialName());
                        // 규격
                        c1.setCellValue(item.getSpecification() != null ? item.getSpecification() : "");
                        // 수량
                        int qty = (int) Math.ceil(item.getCalculatedQty());
                        c2.setCellValue(qty);
                        // 단가 (마스터 테이블의 원래 단가)
                        c3.setCellValue(item.getCustomerUnitPrice());
                        
                        // 공급가액, 세액 계산
                        long rowTotal = (long) item.getCustomerUnitPrice() * qty;
                        long supplyAmt = Math.round(rowTotal / 1.1);
                        long taxAmt = rowTotal - supplyAmt;

                        c4.setCellValue(supplyAmt);
                        c5.setCellValue(taxAmt);

                        totalSupplyAmt += supplyAmt;
                        totalTaxAmt += taxAmt;
                    } else if (rIdx == itemsCount && estimate.getMarginRate() != null && estimate.getMarginRate() > 0) {
                        c2.setCellStyle(borderRightNumeric);
                        c3.setCellStyle(borderRightNumeric);
                        c4.setCellStyle(borderRightNumeric);
                        c5.setCellStyle(borderRightNumeric);
                        
                        long currentTotal = totalSupplyAmt + totalTaxAmt;
                        long marginRowTotal = estimate.getTotalAmount() - currentTotal;
                        long marginSupplyAmt = Math.round(marginRowTotal / 1.1);
                        long marginTaxAmt = marginRowTotal - marginSupplyAmt;

                        c0.setCellValue("이윤 및 관리비");
                        c1.setCellValue("");
                        c2.setCellValue(1);
                        c3.setCellValue(marginRowTotal);
                        c4.setCellValue(marginSupplyAmt);
                        c5.setCellValue(marginTaxAmt);

                        totalSupplyAmt += marginSupplyAmt;
                        totalTaxAmt += marginTaxAmt;
                    } else {
                        // 빈 셀 세팅
                        c0.setCellValue("");
                        c1.setCellValue("");
                        c2.setCellValue("-");
                        c3.setCellValue("-");
                        c4.setCellValue("-");
                        c5.setCellValue("-");
                    }
                }

                // 34행: 계 (합계 행)
                int totalRowIdx = dataStartRow + maxDataRows; // 인덱스 33 (34행)
                org.apache.poi.xssf.usermodel.XSSFRow totalRow = sheet.createRow(totalRowIdx);
                totalRow.setHeightInPoints(24);

                org.apache.poi.xssf.usermodel.XSSFCellStyle totalLabelStyle = workbook.createCellStyle();
                totalLabelStyle.cloneStyleFrom(borderCenter);
                totalLabelStyle.setFont(boldFont);

                for (int i = 0; i < 4; i++) {
                    org.apache.poi.xssf.usermodel.XSSFCell cell = totalRow.createCell(i);
                    cell.setCellStyle(totalLabelStyle);
                    if (i == 0) cell.setCellValue("계");
                }
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(totalRowIdx, totalRowIdx, 0, 3));

                org.apache.poi.xssf.usermodel.XSSFCell totalSupplyCell = totalRow.createCell(4);
                totalSupplyCell.setCellValue(totalSupplyAmt);
                totalSupplyCell.setCellStyle(borderRightNumeric);

                org.apache.poi.xssf.usermodel.XSSFCell totalTaxCell = totalRow.createCell(5);
                totalTaxCell.setCellValue(totalTaxAmt);
                totalTaxCell.setCellStyle(borderRightNumeric);


                // 38행: 우측 하단 거래처명 귀중 서명란 (E37~F37 병합하여 렌더링)
                int signRowIdx = totalRowIdx + 4; // 인덱스 37 (38행)
                org.apache.poi.xssf.usermodel.XSSFRow rSign = sheet.createRow(signRowIdx);
                rSign.setHeightInPoints(35);
                org.apache.poi.xssf.usermodel.XSSFCell cellSign = rSign.createCell(4);
                cellSign.setCellValue(clientName + " 귀중");

                org.apache.poi.xssf.usermodel.XSSFCellStyle signStyle = workbook.createCellStyle();
                org.apache.poi.xssf.usermodel.XSSFFont signFont = workbook.createFont();
                signFont.setFontName("맑은 고딕");
                signFont.setFontHeightInPoints((short) 16);
                signFont.setBold(true);
                signStyle.setFont(signFont);
                signStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.RIGHT);
                signStyle.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
                cellSign.setCellStyle(signStyle);
                rSign.createCell(5).setCellStyle(signStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(signRowIdx, signRowIdx, 4, 5));


                // 열 너비 지정 (A~F열)
                sheet.setColumnWidth(0, 35 * 256);  // 품명
                sheet.setColumnWidth(1, 12 * 256);  // 규격
                sheet.setColumnWidth(2, 10 * 256);  // 수량
                sheet.setColumnWidth(3, 14 * 256);  // 단가
                sheet.setColumnWidth(4, 16 * 256);  // 공급가액
                sheet.setColumnWidth(5, 16 * 256);  // 세액

                ByteArrayOutputStream out = new ByteArrayOutputStream();
                workbook.write(out);
                byte[] fileBytes = out.toByteArray();
                String safeFileName = "Interior_Estimate_No_" + estimateId + ".xlsx";

                return ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeFileName + "\"")
                        .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        .body(fileBytes);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    // 숫자를 한글 금액명으로 변환하는 국문 파서
    private String numToKorean(long amount) {
        if (amount == 0) return "영원정";
        String[] hanArr = {"", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"};
        String[] unitArr = {"", "십", "백", "천"};
        String[] gillionArr = {"", "만", "억", "조"};

        StringBuilder sb = new StringBuilder();
        String strAmount = String.valueOf(amount);
        int len = strAmount.length();

        for (int i = 0; i < len; i++) {
            int num = strAmount.charAt(i) - '0';
            int unitIdx = (len - 1 - i) % 4;
            int gillionIdx = (len - 1 - i) / 4;

            if (num > 0) {
                sb.append(hanArr[num]).append(unitArr[unitIdx]);
            }

            // 4자리 단위(만, 억, 조)의 끝자리에 도달했을 때
            if (unitIdx == 0) {
                // 해당 4자리 블록 내에 숫자가 하나라도 존재하는지 체크하여 gillion 단위 추가
                long blockValue = (amount / (long) Math.pow(10, gillionIdx * 4)) % 10000;
                if (blockValue > 0) {
                    sb.append(gillionArr[gillionIdx]);
                }
            }
        }
        sb.append("원정");
        return sb.toString();
    }
}
