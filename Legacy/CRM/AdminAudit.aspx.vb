Imports System.Data.SqlClient
Imports system.Web.Configuration
'Imports DataManage
Imports DocManage
Imports Microsoft.VisualBasic

Partial Class AdminAudit
    Inherits System.Web.UI.Page
    Dim AuditTrailInsert As String = ""

    Protected Sub LstReports_SelectedIndexChanged(ByVal sender As Object, ByVal e As System.EventArgs)

    End Sub

    Protected Sub rdosearch_SelectedIndexChanged(ByVal sender As Object, ByVal e As System.EventArgs)

    End Sub

    Protected Sub txtSearch_TextChanged(ByVal sender As Object, ByVal e As System.EventArgs)

    End Sub

    Protected Sub txtDateFrom_TextChanged(ByVal sender As Object, ByVal e As System.EventArgs)

    End Sub

    Protected Sub txtDateTo_TextChanged(ByVal sender As Object, ByVal e As System.EventArgs)

    End Sub

    Protected Sub Button1_Click1(ByVal sender As Object, ByVal e As System.EventArgs) Handles Button1.Click
        GenerateReport()
    End Sub

    Private Sub GenerateReport()
        Dim searchStr As String = ""
        Dim RptFormula As String = ""
        Dim RptName As String = ""
        Dim mySqlAction As String = ""
        Session("DateRange") = Nothing

        Label1.Text = ""
        Label2.Text = ""

        Try

            Select Case LstReports.SelectedValue
                Case "Login"
                    If rdosearch.Items(0).Selected = False And rdosearch.Items(1).Selected = False Then
                        If CheckBox1.Checked = False Then '---No date filtering

                            RptName = "AdminAudit"
                            Session("LoginUser") = Session("FullNames")
                            Session("RptToPrint") = RptName
                            ' Session("RptFormula") = RptFormula
                            RptFormula = "{AdminAuditTrail.ActionType}='Login'"

                        Else '---Filter by date

                            If txtDateFrom.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub
                            If txtDateTo.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub

                            Dim mydate1 As Date = txtDateFrom.Text.ToString
                            Dim mydate2 As Date = txtDateTo.Text.ToString

                            Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                            Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                            If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                                RptFormula = "{AdminAuditTrail.ActionDate} >= DATE(" & str1 & ") and {AdminAuditTrail.ActionDate} <= DATE(" & str2 & ") and {AdminAuditTrail.ActionType}='Login'"
                                Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                                RptName = "AdminAudit"
                            Else
                                RptName = "AdminAudit"
                            End If
                        End If

                    End If


                    If rdosearch.Items(0).Selected = True Then
                        If CheckBox1.Checked = False Then '---No Date Filtering

                            RptName = "AdminAudit"
                            Session("LoginUser") = Session("FullNames")
                            Session("RptToPrint") = RptName
                            ' Session("RptFormula") = RptFormula
                            '' RptName = "AtmReport"
                            RptFormula = "{AdminAuditTrail.ActionType}='Login'"

                        Else '---Filter by date

                            If txtDateFrom.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub
                            If txtDateTo.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub

                            Dim mydate1 As Date = txtDateFrom.Text.ToString
                            Dim mydate2 As Date = txtDateTo.Text.ToString

                            Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                            Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                            If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                                RptFormula = "{AdminAuditTrail.ActionDate} >= DATE(" & str1 & ") and {AdminAuditTrail.ActionDate} <= DATE(" & str2 & ") and {AdminAuditTrail.ActionType}='Login'"
                                Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                                RptName = "AdminAudit"
                            Else
                                RptName = "AdminAudit"
                            End If
                        End If


                    ElseIf rdosearch.Items(1).Selected = True Then ''And txtSearch.Text <> "" Then
                        If txtSearch.Text = "" Then Label2.Text = "Please enter Username to filter by" : Exit Sub

                        If CheckBox1.Checked = False Then '---No Date Filtering

                            RptName = "AdminAudit"
                            Session("LoginUser") = Session("FullNames")
                            Session("RptToPrint") = RptName
                            Session("RptFormula") = RptFormula
                            RptFormula = "{AdminAuditTrail.UserName} = '" & txtSearch.Text.Trim & "' and {AdminAuditTrail.ActionType}='Login'"

                        Else '---Filter by date

                            If txtDateFrom.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub
                            If txtDateTo.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub

                            Dim mydate1 As Date = txtDateFrom.Text.ToString
                            Dim mydate2 As Date = txtDateTo.Text.ToString

                            Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                            Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                            If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                                RptFormula = "{AdminAuditTrail.ActionDate} >= DATE(" & str1 & ") and {AdminAuditTrail.ActionDate} <= DATE(" & str2 & ") and {AdminAuditTrail.UserName} = '" & txtSearch.Text.Trim & "' and {AdminAuditTrail.ActionType}='Login'"
                                Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                                RptName = "AdminAudit"
                            Else
                                RptName = "AdminAudit"
                            End If
                        End If

                    End If

                Case "Actions"

                    If rdosearch.Items(0).Selected = False And rdosearch.Items(1).Selected = False Then

                        If CheckBox1.Checked = False Then '--No Date Filtering
                            RptName = "AdminAudit"
                            Session("LoginUser") = Session("FullNames")
                            Session("RptToPrint") = RptName
                            ' Session("RptFormula") = RptFormula
                            RptFormula = "{AdminAuditTrail.ActionType}<>'Login' "

                        Else '--Filter by date

                            If txtDateFrom.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub
                            If txtDateTo.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub

                            Dim mydate1 As Date = txtDateFrom.Text.ToString
                            Dim mydate2 As Date = txtDateTo.Text.ToString

                            Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                            Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                            If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                                RptFormula = "{AdminAuditTrail.ActionDate} >=DATE(" & str1 & ") and {AdminAuditTrail.ActionDate}<=DATE(" & str2 & ") and {AdminAuditTrail.ActionType}<>'Login'"
                                Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                                RptName = "AdminAudit"
                            Else
                                RptName = "AdminAudit"
                            End If
                        End If


                    End If

                    If rdosearch.Items(0).Selected = True Then

                        If CheckBox1.Checked = False Then '---No Date Filtering
                            RptName = "AdminAudit"
                            Session("LoginUser") = Session("FullNames")
                            Session("RptToPrint") = RptName
                            Session("RptFormula") = RptFormula
                            '' RptName = "AtmReport"
                            RptFormula = "{AdminAuditTrail.ActionType}<>'Login' "

                        Else '---Filter by date

                            If txtDateFrom.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub
                            If txtDateTo.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub

                            Dim mydate1 As Date = txtDateFrom.Text.ToString
                            Dim mydate2 As Date = txtDateTo.Text.ToString

                            Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                            Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                            If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                                RptFormula = "{AdminAuditTrail.ActionDate} >=DATE(" & str1 & ") and {AdminAuditTrail.ActionDate}<=DATE(" & str2 & ") and {AdminAuditTrail.ActionType}<>'Login'"
                                Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                                RptName = "AdminAudit"
                            Else
                                RptName = "AdminAudit"
                            End If
                        End If

                    Else
                        If rdosearch.Items(1).Selected = True Then

                            If txtSearch.Text = "" Then Label2.Text = "Please enter Username to filter by" : Exit Sub

                            If CheckBox1.Checked = False Then '---No Date Filtering
                                RptName = "AdminAudit"
                                Session("LoginUser") = Session("FullNames")
                                Session("RptToPrint") = RptName
                                Session("RptFormula") = RptFormula
                                RptFormula = "{AdminAuditTrail.UserName}='" & txtSearch.Text.Trim & "' and {AdminAuditTrail.ActionType}<>'Login'"

                            Else '---Filter by date

                                If txtDateFrom.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub
                                If txtDateTo.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub

                                Dim mydate1 As Date = txtDateFrom.Text.ToString
                                Dim mydate2 As Date = txtDateTo.Text.ToString

                                Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                                Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                                If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                                    RptFormula = "{AdminAuditTrail.ActionDate} >=DATE(" & str1 & ") and {AdminAuditTrail.ActionDate}<=DATE(" & str2 & ") and {AdminAuditTrail.UserName}='" & txtSearch.Text.Trim & "' and {AdminAuditTrail.ActionType}<>'Login'"
                                    Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                                    RptName = "AdminAudit"
                                Else
                                    RptName = "AdminAudit"
                                End If
                            End If

                        End If


                    End If


                Case "Invalid Login"
                    If rdosearch.Items(0).Selected = False And rdosearch.Items(1).Selected = False Then

                        If CheckBox1.Checked = False Then '---No Date Filtering
                            RptName = "AdminAudit"
                            Session("LoginUser") = Session("FullNames")
                            Session("RptToPrint") = RptName

                            ' Session("RptFormula") = RptFormula
                            RptFormula = "{AdminAuditTrail.ActionType}='Login' and {AdminAuditTrail.ActionDescription} LIKE '*Unsuccessful Login to Document Management System*'"

                        Else '---Filter by date

                            If txtDateFrom.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub
                            If txtDateTo.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub

                            Dim mydate1 As Date = txtDateFrom.Text.ToString
                            Dim mydate2 As Date = txtDateTo.Text.ToString

                            Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                            Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                            If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                                RptFormula = "{AdminAuditTrail.ActionDate} >=DATE(" & str1 & ") and {AdminAuditTrail.ActionDate}<=DATE(" & str2 & ") and {AdminAuditTrail.ActionType}='Login' and {AdminAuditTrail.ActionDescription} LIKE '*Unsuccessful Login to Document Management System*'"
                                Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                                RptName = "AdminAudit"
                            Else
                                RptName = "AdminAudit"
                            End If
                        End If


                    End If

                    If rdosearch.Items(0).Selected = True Then

                        If CheckBox1.Checked = False Then '---No Date Filtering
                            RptName = "AdminAudit"
                            Session("LoginUser") = Session("FullNames")
                            Session("RptToPrint") = RptName
                            ' Session("RptFormula") = RptFormula
                            '' RptName = "AtmReport"
                            RptFormula = "{AdminAuditTrail.ActionType}='Login' and {AdminAuditTrail.ActionDescription} LIKE '*Unsuccessful Login to Document Management System*'"

                        Else '---Filter by date

                            If txtDateFrom.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub
                            If txtDateTo.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub

                            Dim mydate1 As Date = txtDateFrom.Text.ToString
                            Dim mydate2 As Date = txtDateTo.Text.ToString

                            Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                            Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                            If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                                RptFormula = "{AdminAuditTrail.ActionDate} >=DATE(" & str1 & ") and {AdminAuditTrail.ActionDate}<=DATE(" & str2 & ") and {AdminAuditTrail.ActionType}='Login' and {AdminAuditTrail.ActionDescription} LIKE '*Unsuccessful Login to Document Management System*'"
                                Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                                RptName = "AdminAudit"
                            Else
                                RptName = "AdminAudit"
                            End If
                        End If


                    ElseIf rdosearch.Items(1).Selected = True Then ''And txtSearch.Text <> "" Then

                        If txtSearch.Text = "" Then Label2.Text = "Please enter Username to filter by" : Exit Sub

                        If CheckBox1.Checked = False Then '---No Date Filtering
                            RptName = "AdminAudit"
                            Session("LoginUser") = Session("FullNames")
                            Session("RptToPrint") = RptName
                            Session("RptFormula") = RptFormula
                            RptFormula = "{AdminAuditTrail.UserName}='" & txtSearch.Text.Trim & "' and {AdminAuditTrail.ActionType}='Login' and {AdminAuditTrail.ActionDescription} LIKE '*Unsuccessful Login to Document Management System*'"

                        Else '---Filter by date

                            If txtDateFrom.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub
                            If txtDateTo.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub

                            Dim mydate1 As Date = txtDateFrom.Text.ToString
                            Dim mydate2 As Date = txtDateTo.Text.ToString

                            Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                            Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                            If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                                RptFormula = "{AdminAuditTrail.ActionDate} >=DATE(" & str1 & ") and {AdminAuditTrail.ActionDate}<=DATE(" & str2 & ") and {AdminAuditTrail.UserName}='" & txtSearch.Text.Trim & "' and {AdminAuditTrail.ActionType}='Login' and {AdminAuditTrail.ActionDescription} LIKE '*Unsuccessful Login to Document Management System*'"
                                Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                                RptName = "AdminAudit"
                            Else
                                RptName = "AdminAudit"
                            End If
                        End If

                    End If

                Case "Full Audit"
                    If rdosearch.Items(0).Selected = False And rdosearch.Items(1).Selected = False Then
                        If CheckBox1.Checked = False Then '---No date filtering

                            RptName = "AdminAudit"
                            Session("LoginUser") = Session("FullNames")
                            Session("RptToPrint") = RptName
                            ''RptFormula = "{AdminAuditTrail.ActionType}='Login'"

                        Else '---Filter by date

                            If txtDateFrom.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub
                            If txtDateTo.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub

                            Dim mydate1 As Date = txtDateFrom.Text.ToString
                            Dim mydate2 As Date = txtDateTo.Text.ToString

                            Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                            Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                            If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                                RptFormula = "{AdminAuditTrail.ActionDate} >= DATE(" & str1 & ") and {AdminAuditTrail.ActionDate} <= DATE(" & str2 & ")"
                                Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                                RptName = "AdminAudit"
                            Else
                                RptName = "AdminAudit"
                            End If

                            ''If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                            ''    RptFormula = "{AdminAuditTrail.ActionDate} >= DATE(" & str1 & ") and {AdminAuditTrail.ActionDate} <= DATE(" & str2 & ") and {AdminAuditTrail.ActionType}='Login'"
                            ''    Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                            ''    RptName = "AdminAudit"
                            ''Else
                            ''    RptName = "AdminAudit"
                            ''End If
                        End If

                    End If


                    If rdosearch.Items(0).Selected = True Then
                        If CheckBox1.Checked = False Then '---No Date Filtering

                            RptName = "AdminAudit"
                            Session("LoginUser") = Session("FullNames")
                            Session("RptToPrint") = RptName
                            ''RptFormula = "{AdminAuditTrail.ActionType}='Login'"

                        Else '---Filter by date

                            If txtDateFrom.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub
                            If txtDateTo.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub

                            Dim mydate1 As Date = txtDateFrom.Text.ToString
                            Dim mydate2 As Date = txtDateTo.Text.ToString

                            Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                            Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                            If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                                RptFormula = "{AdminAuditTrail.ActionDate} >= DATE(" & str1 & ") and {AdminAuditTrail.ActionDate} <= DATE(" & str2 & ")"
                                Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                                RptName = "AdminAudit"
                            Else
                                RptName = "AdminAudit"
                            End If

                            ''If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                            ''    RptFormula = "{AdminAuditTrail.ActionDate} >= DATE(" & str1 & ") and {AdminAuditTrail.ActionDate} <= DATE(" & str2 & ") and {AdminAuditTrail.ActionType}='Login'"
                            ''    Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                            ''    RptName = "AdminAudit"
                            ''Else
                            ''    RptName = "AdminAudit"
                            ''End If
                        End If


                    ElseIf rdosearch.Items(1).Selected = True Then ''And txtSearch.Text <> "" Then
                        If txtSearch.Text = "" Then Label2.Text = "Please enter Username to filter by" : Exit Sub

                        If CheckBox1.Checked = False Then '---No Date Filtering

                            RptName = "AdminAudit"
                            Session("LoginUser") = Session("FullNames")
                            Session("RptToPrint") = RptName
                            Session("RptFormula") = RptFormula
                            RptFormula = "{AdminAuditTrail.UserName} = '" & txtSearch.Text.Trim & "'"
                            ''RptFormula = "{AdminAuditTrail.UserName} = '" & txtSearch.Text.Trim & "' and {AdminAuditTrail.ActionType}='Login'"

                        Else '---Filter by date

                            If txtDateFrom.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub
                            If txtDateTo.Text.Trim = "" Then Label1.Text = "Please select a date range" : Exit Sub

                            Dim mydate1 As Date = txtDateFrom.Text.ToString
                            Dim mydate2 As Date = txtDateTo.Text.ToString

                            Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                            Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                            If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                                RptFormula = "{AdminAuditTrail.ActionDate} >= DATE(" & str1 & ") and {AdminAuditTrail.ActionDate} <= DATE(" & str2 & ") and {AdminAuditTrail.UserName} = '" & txtSearch.Text.Trim & "'"
                                Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                                RptName = "AdminAudit"
                            Else
                                RptName = "AdminAudit"
                            End If

                            ''If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                            ''    RptFormula = "{AdminAuditTrail.ActionDate} >= DATE(" & str1 & ") and {AdminAuditTrail.ActionDate} <= DATE(" & str2 & ") and {AdminAuditTrail.UserName} = '" & txtSearch.Text.Trim & "' and {AdminAuditTrail.ActionType}='Login'"
                            ''    Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                            ''    RptName = "AdminAudit"
                            ''Else
                            ''    RptName = "AdminAudit"
                            ''End If
                        End If

                    End If


            End Select

            Session("RptToPrint") = RptName
            Session("RptFormula") = RptFormula

            'AUDIT TRAIL-------
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Admin Audit Trail", "Viewed Admin Audit Trail report. Report Viewed:-" & Session("RptFormula"), _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            '----END AUDIT TRAIL-----

            ResponseHelper.Redirect("ReportViewer.aspx", "_blank", "")

        Catch ex As Exception

        End Try
    End Sub

    Private Sub GenerateReportOlder()
        Try
            Dim searchStr As String = ""
            Dim RptFormula As String = ""
            Dim RptName As String = ""
            Dim mySqlAction As String = ""

            Session("DateRange") = Nothing

            Select Case LstReports.SelectedValue
                Case "Login"
                    If rdosearch.Items(0).Selected = False And rdosearch.Items(1).Selected = False Then

                        RptName = "AdminAudit"
                        Session("LoginUser") = Session("FullNames")
                        Session("RptToPrint") = RptName
                        ' Session("RptFormula") = RptFormula
                        RptFormula = "{AdminAuditTrail.ActionType}='Login'"

                    End If

                    If CheckBox1.Checked = True Then
                        If txtDateFrom.Text.Trim = "" Then Label1.Visible = True : Exit Sub
                        If txtDateTo.Text.Trim = "" Then Label1.Visible = True : Exit Sub

                        Dim mydate1 As Date = txtDateFrom.Text.ToString
                        Dim mydate2 As Date = txtDateTo.Text.ToString

                        Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                        Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                        If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                            RptFormula = "{AdminAuditTrail.ActionDate} >=DATE(" & str1 & ") and {AdminAuditTrail.ActionDate}<=DATE(" & str2 & ")"
                            Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                            RptName = "AdminAudit"
                        Else
                            RptName = "AdminAudit"
                        End If
                    End If


                    If rdosearch.Items(0).Selected = True Then
                        RptName = "AdminAudit"
                        Session("LoginUser") = Session("FullNames")
                        Session("RptToPrint") = RptName
                        ' Session("RptFormula") = RptFormula
                        '' RptName = "AtmReport"
                        RptFormula = "{AdminAuditTrail.ActionType}='Login'"

                    ElseIf rdosearch.Items(1).Selected = True Then ''And txtSearch.Text <> "" Then
                        RptName = "AdminAudit"
                        Session("LoginUser") = Session("FullNames")
                        Session("RptToPrint") = RptName
                        Session("RptFormula") = RptFormula
                        RptFormula = "{AdminAuditTrail.UserName}='" & Me.txtSearch.Text & "'"
                    End If

                Case "Actions"

                    If rdosearch.Items(0).Selected = False And rdosearch.Items(1).Selected = False Then

                        RptName = "AdminAudit"
                        Session("LoginUser") = Session("FullNames")
                        Session("RptToPrint") = RptName
                        ' Session("RptFormula") = RptFormula
                        RptFormula = "{AdminAuditTrail.ActionType}<>'Login' "

                    End If

                    If rdosearch.Items(0).Selected = True Then
                        RptName = "AdminAudit"
                        Session("LoginUser") = Session("FullNames")
                        Session("RptToPrint") = RptName
                        Session("RptFormula") = RptFormula
                        '' RptName = "AtmReport"
                        RptFormula = "{AdminAuditTrail.ActionType}<>'Login' " '"
                    Else
                        If rdosearch.Items(1).Selected = True Then ''And txtSearch.Text <> "" Then
                            RptName = "AdminAudit"
                            Session("LoginUser") = Session("FullNames")
                            Session("RptToPrint") = RptName
                            Session("RptFormula") = RptFormula
                            RptFormula = "{AdminAuditTrail.UserName}='" & Me.txtSearch.Text & "'"
                        End If


                    End If
                    If CheckBox1.Checked = True Then
                        If txtDateFrom.Text.Trim = "" Then Label1.Visible = True : Exit Sub
                        If txtDateTo.Text.Trim = "" Then Label1.Visible = True : Exit Sub

                        Dim mydate1 As Date = txtDateFrom.Text.ToString
                        Dim mydate2 As Date = txtDateTo.Text.ToString

                        Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                        Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                        If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                            RptFormula = "{AdminAuditTrail.ActionDate} >=DATE(" & str1 & ") and {AdminAuditTrail.ActionDate}<=DATE(" & str2 & ")"
                            Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                            RptName = "AdminAudit"
                        Else
                            RptName = "AdminAudit"
                        End If
                    End If

                    'End If
                Case "Invalid Login"
                    If rdosearch.Items(0).Selected = False And rdosearch.Items(1).Selected = False Then

                        RptName = "AdminAudit"
                        Session("LoginUser") = Session("FullNames")
                        Session("RptToPrint") = RptName
                        ' Session("RptFormula") = RptFormula
                        RptFormula = "{AdminAuditTrail.ActionType}='Login' and {AdminAuditTrail.ActionDescription}='UNSECCESSFUL Login to Document Management System'"

                    End If

                    If CheckBox1.Checked = True Then
                        If txtDateFrom.Text.Trim = "" Then Label1.Visible = True : Exit Sub
                        If txtDateTo.Text.Trim = "" Then Label1.Visible = True : Exit Sub

                        Dim mydate1 As Date = txtDateFrom.Text.ToString
                        Dim mydate2 As Date = txtDateTo.Text.ToString

                        Dim str1 As String = Format(mydate1, "yyyy, MM, dd")
                        Dim str2 As String = Format(mydate2, "yyyy, MM, dd")
                        If txtDateFrom.Text <> "" And Me.txtDateTo.Text <> "" Then
                            RptFormula = "{AdminAuditTrail.ActionDate} >=DATE(" & str1 & ") and {AdminAuditTrail.ActionDate}<=DATE(" & str2 & ")"
                            Session("DateRange") = " Date Between " & mydate1.ToString("dd-MMM-yyyy") & " and " & mydate2.ToString("dd-MMM-yyyy")
                            RptName = "AdminAudit"
                        Else
                            RptName = "AdminAudit"
                        End If
                    End If


                    If rdosearch.Items(0).Selected = True Then
                        RptName = "AdminAudit"
                        Session("LoginUser") = Session("FullNames")
                        Session("RptToPrint") = RptName
                        ' Session("RptFormula") = RptFormula
                        '' RptName = "AtmReport"
                        RptFormula = "{AdminAuditTrail.ActionType}='Login'"

                    ElseIf rdosearch.Items(1).Selected = True Then ''And txtSearch.Text <> "" Then
                        RptName = "AdminAudit"
                        Session("LoginUser") = Session("FullNames")
                        Session("RptToPrint") = RptName
                        Session("RptFormula") = RptFormula
                        RptFormula = "{AdminAuditTrail.UserName}='" & Me.txtSearch.Text & "'"
                    End If


            End Select

            Session("RptToPrint") = RptName
            Session("RptFormula") = RptFormula

            ''-----AUDIT TRAIL-------
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Admin Audit Trail", "Viewed Admin Audit Trail report. Report Viewed:-" & Session("RptFormula"), _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            '----END AUDIT TRAIL-----

            ResponseHelper.Redirect("ReportViewer1.aspx", "_blank", "")

        Catch ex As Exception

        End Try
    End Sub

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        If Not Page.IsPostBack Then
            'DisplayFThistory("All")

            'AUDIT TRAIL-------
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Page Access", "Accessed Admin Audit Trail reports page", _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            '----END AUDIT TRAIL-----

            ' ''****Audit Trail for page access****
            ''Dim MyDate As DateTime = Date.Today
            ''Dim MyDate1 As String = MyDate.ToString("dd-MMM-yyyy")

            ''Dim MyTime As DateTime = Date.Now
            ''Dim MyTime1 As String = MyTime.ToString("hh:mm:ss")

            ''Dim MyClientIP As String = Request.UserHostAddress.ToString
            ''Dim MyURL As Uri = Request.Url

            ''AuditTrailInsert = "Insert Into AdminAuditTrail(UserName,ActionType,ActionDescription,PageAccessed,ActionDate,ActionTime,ClientIPAddress,SessionID) values('" & Session("UserName") & "','Page Access','Accessed Admin Audit Trail reports page','" & MyURL.AbsolutePath.ToString & "','" & MyDate1 & "','" & MyTime1 & "','" & MyClientIP & "','" & Session.SessionID.ToString & "')"

            ''AuditTrailLog(AuditTrailInsert)

            ' ''****Audit Trail for page access****

        End If
    End Sub

    Private Sub AuditTrailLog(ByVal Updatestring As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(Updatestring, DataManagement.DBActionType.Insert)
    End Sub

End Class
