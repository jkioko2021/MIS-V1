Imports System.Data
Imports System.Data.OleDb
Imports System.Data.SqlClient
Imports System.IO
Imports System.Runtime.CompilerServices
Imports System.Web.Configuration
Imports DocManage
Imports DocManage.DataManagement
Imports Mymail
Imports Telerik.Web.UI



Partial Class _Default
        Inherits System.Web.UI.Page
        Dim MyDBAction As New DataManagement
        Dim MyDatable As New Data.DataTable
        Dim MyQuery As String = ""
        Dim SqlAction As String = ""
        Dim MyDatatable As DataTable : Dim Str As String
        Dim AB As Integer
        Dim MailSent As Boolean = False

        Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load

            If Not Me.IsPostBack Then
                Try
                    Me.dtreceivedate.DbSelectedDate = DateTime.Now
                    Me.dtreceivedate.Enabled = False
                    Me.ltEmbed.Text = ""
                    Me.HiddenField1.Value = 0
                    Me.chkmedical.Enabled = False
                    Me.Session("empcode") = Nothing
                    Me.Session("agentemail") = Nothing

                    Me.Str = "SELECT DISTINCT USER_ID,AGENT_NAME FROM COMMISSION.dbo.TBL_MIS_SALES_AGENTS WHERE ACTIVE=1  ORDER BY AGENT_NAME"
                    Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                    Dim cboagent As RadComboBox = Me.cboagent
                    cboagent.Items.Clear()
                    cboagent.DataSource = Me.MyDatatable
                    cboagent.DataTextField = Me.MyDatatable.Columns("AGENT_NAME").ToString()
                    cboagent.DataValueField = Me.MyDatatable.Columns("USER_ID").ToString()
                    cboagent.DataBind()

                    Me.Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE   approved=1 AND Deleted=0 AND Department='MEMBERSHIP'"
                    Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                    Dim cboAllocateto As RadComboBox = Me.cboAllocateto
                    cboAllocateto.Items.Clear()
                    cboAllocateto.DataSource = Me.MyDatatable
                    cboAllocateto.DataTextField = Me.MyDatatable.Columns("EmployeeName").ToString()
                    cboAllocateto.DataValueField = Me.MyDatatable.Columns("username").ToString()
                    cboAllocateto.DataBind()

                    Me.Str = "SELECT COUNTY_CODE,COUNTY_NAME from [dbo].[TBL_MIS_COUNTY]"
                    Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                    Dim cboCounty As RadComboBox = Me.cboCounty
                    cboCounty.Items.Clear()
                    cboCounty.DataSource = Me.MyDatatable
                    cboCounty.DataTextField = Me.MyDatatable.Columns("COUNTY_NAME").ToString()
                    cboCounty.DataValueField = Me.MyDatatable.Columns("COUNTY_CODE").ToString()
                    cboCounty.DataBind()
                    Me.loadGrid_N()

                    Me.txtProposer.Enabled = False
                    Me.dtreceivedate.Enabled = False
                    Me.cboBUS.Enabled = False
                    Me.txtNID.Enabled = False
                    Me.cboBusiness.Enabled = False
                    Me.cboclient.Enabled = False
                    Me.txt_PIN.Enabled = False
                    Me.cboagent.Enabled = False
                    Me.cboPayment.Enabled = False
                    Me.cboCard.Enabled = False
                    Me.cboCounty.Enabled = False
                Catch ex As Exception
                    Me.lblerr.Text = ex.Message
                End Try
            End If

        End Sub
        Public Sub loadGrid_N()
            Me.GDTrackingRef.DataSource = Nothing
            Me.GDTrackingRef.DataBind()
            Me.SqlAction = "SELECT  [File_No],[Proposer_Name],[Forward_Date],Premium,File_Status,Business_Type,Client_Type,[Entered_By],Is_Branch,WALK_IN_CLIENT  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Forwarded=1 AND Ready_For_Update=1 AND Client_Type='R' AND ALLOCATED=0 AND  Business='M'   AND Is_Active=1 and  is_clapi=0  ORDER BY WALK_IN_CLIENT DESC ,Receive_DT ASC"
            Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
            If Me.MyDatable.Rows.Count > 0 Then
                Me.GDTracking.DataSource = Me.MyDatable
                Me.GDTracking.DataBind()
                Me.Session("DAD_T") = Me.MyDatable
                Me.MyDatable = Nothing
            Else
                Me.GDTracking.DataSource = Nothing
                Me.GDTracking.DataBind()
            End If
            Me.SqlAction = "SELECT  [Refund_No],[File_No],[Amount_Paid],[Refund_Amt] ,[Payee_Name],[Payee_eMail],[Payee_Mobile],[Refund_Status],[Refund_Type],[Request_Dt],Entered_By,Client_Type FROM [CRM].[dbo].[TBL_MIS_BUSINESS_TRACKING_REFUNDS] WITH (NOLOCK) WHERE Requested=1 and Allocated =0  AND Is_Active=1 and Client_Type='RET'"
            Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
            If Me.MyDatable.Rows.Count > 0 Then
                Me.GDTrackingRef.DataSource = Me.MyDatable
                Me.GDTrackingRef.DataBind()
                Me.Session("DAD_T_R") = Me.MyDatable
                Me.MyDatable = Nothing
            Else
                Me.GDTrackingRef.DataSource = Nothing
                Me.GDTrackingRef.DataBind()
            End If
        End Sub

        Public Sub loadGrid_Shwaari(ByVal STR As String)

        End Sub

        Public Sub loadGrid(ByVal STR As String)
            Dim dataTable As DataTable = New DataTable()
            Me.GD_DOCS.DataSource = Nothing
            Me.GD_DOCS.DataBind()
            Me.GDNOTES.DataSource = Nothing
            Me.GDNOTES.DataBind()
            Me.GD_PROPOSER.DataSource = Nothing
            Me.GD_PROPOSER.DataBind()
            Try
                Me.SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By] FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" + STR + "' AND ACTIVE=1"
                dataTable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                If dataTable.Rows.Count > 0 Then
                    Me.GD_DOCS.DataSource = dataTable
                    Me.GD_DOCS.DataBind()
                Else
                    Me.SqlAction = " SELECT distinct [DOC_ID],code [File_No],[Doc_Title],[Doc_Date],[File_Name],''[Upload_By] FROM  [DB_ONLINE_PORTAL].[dbo].[TBL_PORTAL_MIS_DOCS] with(nolock) WHERE  code ='" + STR + "'"
                    dataTable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                    If dataTable.Rows.Count > 0 Then
                        Me.GD_DOCS.DataSource = dataTable
                        Me.GD_DOCS.DataBind()
                    Else
                        Me.GD_DOCS.DataSource = Nothing
                        Me.GD_DOCS.DataBind()
                    End If
                End If
                Me.SqlAction = "SELECT [Note_id],[File_No],[Note_From] ,[Note_date],[Notes]  FROM [CRM].[dbo].[TBL_MIS_CRM_BUS_TRACKING_NOTES] WHERE  File_No ='" + STR + "'  AND ACTIVE=1 ORDER BY Note_id DESC"
                dataTable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                If dataTable.Rows.Count > 0 Then
                    Me.GDNOTES.DataSource = dataTable
                    Me.GDNOTES.DataBind()
                Else
                    Me.GDNOTES.DataSource = dataTable
                    Me.GDNOTES.DataBind()
                End If
            Me.SqlAction = "SELECT [File_No],[Proposer_Name], Premium, Client_Type,Pay_Ref_No,Paid_Amt,File_Status  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" + Strings.Trim(STR) + "'  AND Is_Active=1"
            dataTable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
            If dataTable.Rows.Count > 0 Then
                Me.GD_Pay.DataSource = dataTable
                Me.GD_Pay.DataBind()
                Me.txtpaid.Text = dataTable.Compute("sum(Paid_Amt)", String.Empty)
            Else

                Me.SqlAction = "SELECT  FILE_NO  ,PROPOSER_DISPLAY_NAME Proposer_Name,RENEWAL_PREMIUM Premium,PAID_AMOUNT Paid_Amt,REF_NO Pay_Ref_No  FROM [DB_ONLINE_PORTAL].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING_RENEWAL]  WITH (NOLOCK) WHERE  code='" + Strings.Trim(Me.FILE_NO.Text) + "'"
                dataTable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                If dataTable.Rows.Count > 0 Then
                    Me.GD_Pay.DataSource = dataTable
                    Me.GD_Pay.DataBind()
                Else

                    Me.GD_Pay.DataSource = Nothing
                    Me.GD_Pay.DataBind()
                End If
            End If
                Me.GD_PROPOSER.DataSource = Nothing
                Me.GD_PROPOSER.DataBind()
                Me.SqlAction = "SELECT [code] ,[cover_type],[family_size],[plan_name],[plan_limit],[age_band],[premium_amount],[levy_vat],[levy_ext],[stamp_duty], [total_amount], [proposer_firstname]+' '+[proposer_lastname] proposer, [proposer_dob], [application_date]   FROM [DB_ONLINE_PORTAL].[dbo].[TBL_PORTAL_MIS_POLICY]   WITH (NOLOCK) WHERE  code='" + Strings.Trim(Me.FILE_NO.Text) + "'"
                dataTable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                If dataTable.Rows.Count > 0 Then
                    Me.GD_PROPOSER.DataSource = dataTable
                    Me.GD_PROPOSER.DataBind()
                Else
                    Me.GD_PROPOSER.DataSource = Nothing
                    Me.GD_PROPOSER.DataBind()
                End If
                Me.SqlAction = "SELECT [code] ,[relation],[firstname],[lastname],[phone],[email],[id_number],[dob],[gender],[date_added]  FROM [DB_ONLINE_PORTAL].[dbo].[TBL_PORTAL_MIS_MEMBERS] WITH (NOLOCK) WHERE code='" + Strings.Trim(Me.FILE_NO.Text) + "'"
                dataTable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                If dataTable.Rows.Count > 0 Then
                    Me.GD_MEMBERS.DataSource = dataTable
                    Me.GD_MEMBERS.DataBind()
                Else
                    Me.GD_MEMBERS.DataSource = Nothing
                    Me.GD_MEMBERS.DataBind()
                End If
                Me.SqlAction = "SELECT [code] ,[payment_code],[amount],[payer_name],[payment_method],[payment_date]  FROM  [DB_ONLINE_PORTAL].[dbo].[TBL_PORTAL_MIS_PAYMENT] WITH (NOLOCK) WHERE  code='" + Strings.Trim(Me.FILE_NO.Text) + "'"
                dataTable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
            If dataTable.Rows.Count > 0 Then
                Me.GD_Online_Pay.DataSource = dataTable
                Me.GD_Online_Pay.DataBind()
            Else



                Me.GD_Online_Pay.DataSource = Nothing
                    Me.GD_Online_Pay.DataBind()

            End If

            STR = "SELECT POLICY_CODE, PROPOSER_ID,PROPOSER_DISPLAY_NAME,FAMILY_NO,RENEWAL_DATE, PERIOD_FROM,PERIOD_TO,DATEDIFF(DAY,RENEWAL_DATE,GETDATE()) DAYS_DUE,TOTAL_PREMIUM,AGENT,MOBILE_NO FROM [DB_MASTER_RENEWAL].dbo.TBL_MIS_RENEWAL_PROPOSER_LIST  WHERE POLICY_CODE='" & Session("Pol_Code") & "'"
            MyDatable = TryCast(MyDBAction.DBAction(STR, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_REN.DataSource = MyDatable
                GD_REN.DataBind()
                Session("DAD_5") = MyDatable

                MyDatable = Nothing
            Else
                GD_REN.DataSource = Nothing
                GD_REN.DataBind()
            End If
            SqlAction = "SELECT  DISPLAY_MEMBERSHIP_NO,MEMBER_NAME,RELATION,SCHEME_NAME FROM [DB_MASTER_RENEWAL].[dbo].[TBL_MIS_RENEWAL_UPLOAD]  with(nolock) WHERE POLICY_CODE ='" & Session("Pol_Code") & "'   order by DISPLAY_MEMBERSHIP_NO"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_REN_1.DataSource = MyDatable
                GD_REN_1.DataBind()
                Session("TAT_5") = MyDatable
                'lblid.Text = MyDatable.Rows(0).Item("PROPOSER_ID").ToString

                MyDatable = Nothing
            Else
                GD_REN_1.DataSource = Nothing
                GD_REN_1.DataBind()
            End If
        Catch ex As Exception
                Me.lblerr.Text = ex.Message
            End Try
        End Sub

        Protected Sub btnforward_Click(sender As Object, e As System.EventArgs) Handles btnforward.Click
            Dim a_to As String = ""
            Dim is_br As Integer
            Session("msg") = Nothing
            Dim benefit As String

            Try
                If FILE_NO.Text = "" Then
                    lblerr.Text = "Select the File!"
                    Exit Sub
                End If
                benefit = "YES"
                If cboAction.SelectedValue = "" Then
                    lblerr.Text = "Select the Action!"
                    Exit Sub
                End If
                If cboAction.SelectedValue = "A" And cboAllocateto.SelectedValue = "" Then
                    lblerr.Text = "Select the Forward To!"
                    cboAllocateto.Focus()
                    Exit Sub
                End If
                If txtcomment.Text = "" Then
                    lblerr.Text = "Enter short notes!"
                    Exit Sub
                End If
                If cboAction.SelectedValue = "RI" Then
                    a_to = lblenteredby.Text
                Else
                    a_to = cboAllocateto.SelectedValue
                End If

                If CboProd.SelectedValue = "" Then
                    lblerr.Text = "Select Product!"
                    Exit Sub
                End If

                'If Cbosyst.SelectedValue = "Clapi" And cboAction.SelectedValue = "MU" Then
                '    lblerr.Text = "You cannot allocate this Business to Medical UW!"
                '    Exit Sub

                'End If

                If Session("Is_Declined") = 1 Then
                    If cboAction.SelectedValue = "RI" Then
                        UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  File_Status='DECLINED-RETURNED', Allocated=0, Allocated_to='' , Ready_For_update=0,Refund_req=0, where [File_No]= '" & FILE_NO.Text & "'")

                    Else
                        UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  File_Status='REFUND-REQUESTED', Allocated=1, Allocated_to= '" & cboAllocateto.SelectedValue & "' where [File_No]= '" & FILE_NO.Text & "'")

                    End If

                Else
                    If Session("Invoiced") = 1 And cboAction.SelectedValue <> "RI" Then
                        If cboAllocateto.SelectedValue = "" Then
                            lblerr.Text = "Select the Membership user To allocate!"
                            Exit Sub
                        End If
                        UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Product='" & CboProd.Text & "', Allocated=1, Allocated_to= '" & cboAllocateto.SelectedValue & "',  [Allocate_Dt]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "',Benefit_Verified='" & benefit & "' where [File_No]= '" & FILE_NO.Text & "'")
                    Else

                        UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET   Product='" & CboProd.Text & "'  where [File_No]= '" & FILE_NO.Text & "'")
                        MyDBAction.TRACKING_ALLOCATION(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd hh:mm"), Session("username"), a_to, txtcomment.Text, cboAction.SelectedValue, "YES")

                    End If
                    If txtcomment.Text <> "" Then
                        MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
                    End If
                    If cboAction.SelectedValue = "A" And is_br = 0 Then
                        Str = "SELECT EMAIL FROM employees WHERE username='" & cboAllocateto.SelectedValue & "'" '"
                        MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                        If MyDatatable.Rows.Count > 0 Then
                            Session("to") = cboAllocateto.Text
                            Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                            Session("msg") = "Kindly note that you have been Allocated the below Business for update!"
                        Else
                            Session("to") = cboAllocateto.Text
                            Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                            Session("msg") = "Kindly note that you have been Allocated the below Business from Branch to complete update process!"

                        End If
                    ElseIf cboAction.SelectedValue = "RI" Then
                        Session("to") = lblenteredby.Text
                        Session("email") = Session("email_cc")
                        Session("msg") = "Kindly note that the above business has been returned as Incomplete by the Membership Administrator!"

                    ElseIf cboAction.SelectedValue = "MU" Then
                        Session("to") = "Medical Team"
                        Session("email") = "medicalunderwriting@aar.co.ke"
                        Session("msg") = "Kindly note that the above business has been submitted for medical vetting"
                    End If
                End If
                'Session("email") = "jmwaniki@aar.co.ke"
                MailSent = SendLoginDetails(cboAllocateto.SelectedValue, Session("email"), Session("email_cc"))

                lblerr.Text = "Business updated successfully!"
                loadGrid_N()
                txtcomment.Text = ""
                FILE_NO.Text = ""
                chkmedical.Checked = False
                txtProposer.Text = ""
                txtNID.Text = ""
                txt_PIN.Text = ""

                GD_DOCS.DataSource = Nothing
                GD_DOCS.DataBind()
                GDNOTES.DataSource = Nothing
                GDNOTES.DataBind()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End Sub
        Private Sub UpdateRecord(ByVal sqlAction As String)
            Dim MySmsObject As New DataManagement
            MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)
        End Sub

        Protected Sub DownloadFile(sender As Object, e As EventArgs)
            ltEmbed.Text = ""
            Dim id As Integer = Integer.Parse(TryCast(sender, LinkButton).CommandArgument)
            Dim embed As String = "<object data=""{0}{1}"" type=""application/pdf"" width=""1000px"" height=""600px"">"
            embed += "If you are unable to view file, you can download from <a href = ""{0}{1}&download=1"">here</a>"
            embed += " or download <a target = ""_blank"" href = ""{0}{1}&download=1"">Adobe PDF Reader</a> to view the file."
            embed += "</object>"
            ltEmbed.Text = String.Format(embed, ResolveUrl("~/FileDoc.ashx?Id="), id)
        End Sub
    Protected Sub DownloadSchedule(sender As Object, e As EventArgs)
        Try
            Dim Mytable As DataTable = Nothing
            Dim MyDatable_1 As DataTable = Nothing
            Dim MyDatable_2 As DataTable = Nothing
            Dim MyDatable_3 As DataTable = Nothing
            Session("EMPNAME") = Nothing
            Session("FrmDT") = Nothing
            Session("ToDt") = Nothing
            Session("agentEmail") = Nothing
            Session("RecepientEmail") = ""
            Session("MailSent") = False
            Session("EXPORT_TYPE") = "PDF"


            Str = "SELECT [POLICY_CODE],[PROPOSER_DISPLAY_NAME],[FAMILY_NO],[PERIOD_FROM],[PERIOD_TO],[CURR_EXP_DATE],[RENEWAL_DATE],[MEMBER_ADMINISTRATIVE_SEX],[RELATION],[PROPOSER_PRI_ADD_LINE1],[PROPOSER_PRI_EMAIL],[TOTAL_PREMIUM],[AGENT],[DISPLAY_MEMBERSHIP_NO],[MEMBER_NAME],[CATEGORY],[OP_LIMIT],[OP_PREMIUM],IP_LIMIT,[IP_PREMIUM],[PA],[NCD],[LEVIES],[TOT_PREMIUM],[IP_PREM_SILVERPLUS],[LEVIES_S],[SILVERPLUS_PREMIUM],S_PLUS_PREM,INV_NO,PLAN_NAME,SCHEME_NAME,AGE  FROM CRM.[dbo].[VW_RENEWAL_ADVICE] WHERE   POLICY_CODE='" & Session("Pol_Code") & "'  ORDER BY FAMILY_NO"
            MyDatable_1 = Nothing
            MyDatable_1 = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable_1.Rows.Count > 0 Then

                'GENERATE_RPT(MyDatable_1)
                Session("Report_") = "Renewal Schedule"
                Session("PRINT") = "PDF"
                'MyDatable_1 = Nothing
                Session("Mytable") = Nothing
                Session("Reportname") = Nothing
                Session("Mytable") = (MyDatable_1)
                Session("Reportname") = Session("Report_")
                ResponseHelper.Redirect("Reports.aspx", "_blank", "")
                Mytable = Nothing
                System.Threading.Thread.Sleep(5000)
            Else
                lblerr.Text = "No Data Found"
                Exit Sub
            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
            Try
                Me.HiddenField1.Value = 1

                lblerr.Text = ""
                Me.ltEmbed.Text = ""
            Me.Session("Is_Declined") = 0
            Session("Pol_Code") = ""
            Me.Session("email_cc") = Nothing
                Me.ID = CType(Me.GDTracking.SelectedItems(0), GridDataItem).GetDataKeyValue("File_No").ToString()
            Me.SqlAction = "SELECT top 1 [File_No],Pay_Ref_No,Paid_Amt,[Proposer_Name],[Family_code],Premium,File_Status,Business_Type,Receive_dt,entered_By,Agent_id,Medical_UW,Business,  Client_Type,Is_Mtiba,[Is_branch],Rate_Type,Is_IPF,Invoiced ,Is_Declined,NID,PIN_NO,County_Code,PAY_MODE,CARD_TYPE ,POL_CODE_REN   FROM [TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" + Me.ID + "'"
            Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                If Me.MyDatable.Rows.Count > 0 Then
                    Me.FILE_NO.Text = Me.MyDatable.Rows(0)("File_No").ToString()
                    Me.txtProposer.Text = Me.MyDatable.Rows(0)("Proposer_Name").ToString()
                    Me.dtreceivedate.DbSelectedDate = Me.MyDatable.Rows(0)("Receive_dt").ToString()
                    Me.cboBUS.SelectedValue = Me.MyDatable.Rows(0)("Business").ToString()
                    Me.cboBusiness.SelectedValue = Me.MyDatable.Rows(0)("Business_Type").ToString()
                    Me.cboclient.SelectedValue = Me.MyDatable.Rows(0)("Client_Type").ToString()
                    Me.lblenteredby.Text = Me.MyDatable.Rows(0)("entered_By").ToString()
                    Me.cboagent.SelectedValue = Me.MyDatable.Rows(0)("Agent_id").ToString()
                    Me.chkmedical.Checked = Me.MyDatable.Rows(0)("Medical_UW").ToString()
                    Me.Session("Invoiced") = Me.MyDatable.Rows(0)("Invoiced").ToString()
                    Me.Session("Is_Declined") = Me.MyDatable.Rows(0)("Is_Declined").ToString()
                    Me.txtpaid.Text = Me.MyDatable.Rows(0)("Paid_Amt").ToString()
                    Me.refno.Text = Me.MyDatable.Rows(0)("Pay_Ref_No").ToString()
                    Me.txtNID.Text = Me.MyDatable.Rows(0)("NID").ToString()
                    Me.txt_PIN.Text = Me.MyDatable.Rows(0)("PIN_NO").ToString()
                    Me.cboPayment.SelectedValue = Me.MyDatable.Rows(0)("PAY_MODE").ToString()
                    Me.cboCard.SelectedValue = Me.MyDatable.Rows(0)("CARD_TYPE").ToString()
                Me.cboCounty.SelectedValue = Me.MyDatable.Rows(0)("County_Code").ToString()
                Session("Pol_Code") = Me.MyDatable.Rows(0)("Pol_Code_Ren").ToString()
                Me.loadGrid(Me.FILE_NO.Text)
                    Me.Str = "SELECT EMAIL FROM employees WHERE username='" + Me.lblenteredby.Text + "'"
                    Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                    If Me.MyDatatable.Rows.Count > 0 Then
                        Me.Session("email_cc") = Me.MyDatatable.Rows(0)("EMAIL").ToString()
                    Else
                        Me.Str = "SELECT EMAIL FROM SALES.dbo.employees WHERE username='" + Me.lblenteredby.Text + "'"
                        Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                        If Me.MyDatatable.Rows.Count > 0 Then
                            Me.Session("email_CC") = Me.MyDatatable.Rows(0)("EMAIL").ToString()
                        Else
                            Me.Session("email_CC") = "relationship-managers@aar.co.ke"
                        End If
                    End If
                End If
            Catch ex As Exception
                Me.lblerr.Text = ex.Message
            End Try
        End Sub
        Protected Sub GDTracking_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDTracking.PageIndexChanged
            GDTracking.CurrentPageIndex = e.NewPageIndex
            GDTracking.DataSource = Session("DAD_T")
            GDTracking.DataBind()
        End Sub
        Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
            Try
                ltEmbed.Text = ""
                If cbosearch.SelectedValue = "F" Then
                    SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Entered_By  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Forwarded=1 AND Ready_For_Update=1 AND Client_Type<>'C' AND Is_Declined=0 AND ALLOCATED=0 AND Business='M'  AND Is_Active=1"
                ElseIf cbosearch.SelectedValue = "P" Then
                    SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Entered_By  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%'  AND Forwarded=1 AND Ready_For_Update=1 AND Client_Type<>'C' AND Is_Declined=0 AND ALLOCATED=0 AND Business='M'  AND Is_Active=1"
                End If
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    GDTracking.DataSource = MyDatable
                    GDTracking.DataBind()
                    Session("DAD_T") = MyDatable
                    MyDatable = Nothing
                Else
                    GDTracking.DataSource = Nothing
                    GDTracking.DataBind()
                End If
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End Sub

        'Protected Sub cboAction_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboAction.SelectedIndexChanged
        '    cboAllocateto.SelectedValue = ""
        '    ltEmbed.Text = ""
        '    If cboAction.SelectedValue = "RI" Then
        '        cboAllocateto.Enabled = False
        '    ElseIf cboAction.SelectedValue = "MU" Then
        '        cboAllocateto.Enabled = True
        '        Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  Activated=1 AND approved=1 AND Deleted=0 AND Department='MEDICAL UNDERWRITING'" '"
        '        MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
        '        With cboAllocateto
        '            .Items.Clear()
        '            .DataSource = MyDatatable
        '            .DataTextField = MyDatatable.Columns("EmployeeName").ToString
        '            .DataValueField = MyDatatable.Columns("username").ToString
        '            .DataBind()
        '        End With
        '    ElseIf cboAction.SelectedValue = "A" Then
        '        cboAllocateto.Enabled = True
        '        Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  Activated=1 AND approved=1 AND Deleted=0 AND Department='MEMBERSHIP'" '"
        '        MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
        '        With cboAllocateto
        '            .Items.Clear()
        '            .DataSource = MyDatatable
        '            .DataTextField = MyDatatable.Columns("EmployeeName").ToString
        '            .DataValueField = MyDatatable.Columns("username").ToString
        '            .DataBind()
        '        End With
        '    End If

        'End Sub
        Public Function SendLoginDetails(ByVal EmployeeName As String, ByVal RecepientEmail As String, ByVal ccemail As String) As Boolean

            Dim MailSent As Boolean = False
            Dim strMailFromEmail As String = ""
            Dim strMailFromName As String = ""
            Dim MessageSubject As String = ""
            Dim MySqlAction As String = ""
            Dim MyDBAction As New DataManagement
            Dim MyDataTable As New Data.DataTable
            Dim MyEncryption As New SysSettsEncryption
            Dim LoginFromEmail As String = ""
            Dim LoginDisplayName As String = ""
            Dim LoginSubject As String = ""
            Dim EmailServer As String = ""
            Dim EmailUserName As String = ""
            Dim EmailPassword As String = ""
            Dim action As String = ""

            Try ''--Retrieve settings from db n decrypt - Mercy - 12th Apr 2011
                LoginFromEmail = System.Configuration.ConfigurationManager.AppSettings("LoginFromEmail").Trim()
                LoginDisplayName = System.Configuration.ConfigurationManager.AppSettings("LoginDisplayName").Trim()
                LoginSubject = System.Configuration.ConfigurationManager.AppSettings("LoginSubject").Trim()
                'LoginSubject = "BUSINESS ALLOCATION"
                EmailServer = System.Configuration.ConfigurationManager.AppSettings("EmailServer").Trim()
                EmailUserName = System.Configuration.ConfigurationManager.AppSettings("EmailUsername").Trim()
                EmailPassword = System.Configuration.ConfigurationManager.AppSettings("EmailPassword").Trim()

                Dim strHTML As New StringBuilder
                strHTML = strHTML.Append("<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'>")
                strHTML = strHTML.Append("<html xmlns='http://www.w3.org/1999/xhtml' >")
                strHTML = strHTML.Append("<head>")
                strHTML = strHTML.Append("</head>")
                strHTML = strHTML.Append("<body>")
                strHTML = strHTML.Append("<table style='width: 668px'>")
                strHTML = strHTML.Append("<tr>")

                strHTML = strHTML.Append("<td colspan='3'>")
                'strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'> Attention:Relationship Managers")
                strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Dear : </b>" & Session("to") & "  </span>")
                strHTML = strHTML.Append("<br />")
                strHTML = strHTML.Append("<br />")
                MessageSubject = "Membership Status :" & FILE_NO.Text & ""
                strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'>" & Session("msg") & " </span>")
                strHTML = strHTML.Append("<br />")
                strHTML = strHTML.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
                strHTML = strHTML.Append("<br />")
                strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>File No    :</b>" & FILE_NO.Text & " </span>")
                strHTML = strHTML.Append("<br />")
                strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Client Name:</b> " & txtProposer.Text & " </span>")
                strHTML = strHTML.Append("<br />")
                strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Date       :</b> " & Date.Now() & " </span>")
                strHTML = strHTML.Append("<br />")
                strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Updated By :</b> " & Session("FullNames") & " </span>")
                strHTML = strHTML.Append("<br />")
                strHTML = strHTML.Append("<br />")
                strHTML = strHTML.Append("----------------------------------------<b>Notes</b>--------------------------------------------------------")
                strHTML = strHTML.Append("<br />")
                strHTML = strHTML.Append("" & txtcomment.Text & "")
                strHTML = strHTML.Append("<br />")
                strHTML = strHTML.Append("<br />")
                strHTML = strHTML.Append("----------------------------------------End----------------------------------------------------------")
                strHTML = strHTML.Append("<br />")

                strHTML = strHTML.Append("<span style='font-size: 11pt; font-color:RED; font-family: Calibri'><b><i>THIS IS A SYSTEM GENERATED EMAIL.DO NOT REPLY!.</i></b>")
                'Membership Enquiry (membershipenquiry@aar.co.ke)
                strHTML = strHTML.Append("<br />")

                strHTML = strHTML.Append("</table>")
                strHTML = strHTML.Append("</body>")
                strHTML = strHTML.Append("</html>")
                Dim mymail As New Emailing
                MailSent = mymail.SendNotification("", MessageSubject, strHTML.ToString, True, EmailServer, EmailUserName, EmailPassword, RecepientEmail, EmployeeName, LoginFromEmail, LoginDisplayName, ccemail)
                Session("MailSent") = MailSent
            Catch ex As Exception
                'MyDBAction.DoLogs("Class==AssignAdminAccessProfile.vb: Private Sub DisplayMenuItems()" & " : Error : " & ex.Message)
                MailSent = False
            End Try

            Return MailSent
        End Function

        Protected Sub btnedit_Click1(sender As Object, e As EventArgs) Handles btnedit.Click
            cboclient.Enabled = True
            cboBusiness.Enabled = True
        End Sub

        Protected Sub btnupdate_Click(sender As Object, e As EventArgs) Handles btnupdate.Click
            Try
                Dim num As Integer = 0
                Me.UpdateRecord(String.Concat(New String() {"UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET County_Code ='", Me.cboCounty.SelectedValue, "', PIN_NO='", Me.txt_PIN.Text, "' ,NID='", Me.txtNID.Text, "',  Is_Branch='", num, "', Business_type='", Me.cboBusiness.SelectedValue, "', Client_Type='", Me.cboclient.SelectedValue, "'  where [File_No]= '", Me.FILE_NO.Text, "'"}))
                Me.lblerr.Text = "Saved Successful"
                Me.loadGrid_N()
            Catch ex As Exception
                Me.lblerr.Text = ex.Message
            End Try

        End Sub
        Protected Sub GDTrackingRef_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GDTrackingRef.ItemDataBound
            If TypeOf e.Item Is GridDataItem Then

                Dim dataItem As GridDataItem = e.Item
                Dim myCell As TableCell = dataItem("Refund_Type")
                If myCell.Text = "DECLINE" Then
                    dataItem.BackColor = Drawing.Color.Red
                End If
            End If
        End Sub
        Protected Sub GDTracking_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GDTracking.ItemDataBound
            If TypeOf e.Item Is GridDataItem Then

                Dim dataItem As GridDataItem = e.Item
                Dim myCell As TableCell = dataItem("Is_Branch")
            If myCell.Text = 1 Then
                dataItem.BackColor = Drawing.Color.YellowGreen
            End If
            If myCell.Text = 2 Then
                dataItem.BackColor = Drawing.Color.Brown
            End If
        End If
        End Sub




    Private Sub GD_REN_1_SelectedIndexChanged(sender As Object, e As EventArgs) Handles GD_REN_1.SelectedIndexChanged
        GD_REN_1.DataSource = Nothing
        GD_REN_1.DataBind()

        Session("POLICY_CODE") = (DirectCast(GD_REN_1.SelectedItems(0), GridDataItem)).GetDataKeyValue("POLICY_CODE").ToString()

        SqlAction = "SELECT  DISPLAY_MEMBERSHIP_NO,MEMBER_NAME,RELATION,SCHEME_NAME FROM [DB_MASTER_RENEWAL].[dbo].[TBL_MIS_RENEWAL_UPLOAD]  with(nolock) WHERE POLICY_CODE ='" & Session("POLICY_CODE") & "'   order by DISPLAY_MEMBERSHIP_NO"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_REN_1.DataSource = MyDatable
            GD_REN_1.DataBind()
            Session("TAT_5") = MyDatable
            'lblid.Text = MyDatable.Rows(0).Item("PROPOSER_ID").ToString

            MyDatable = Nothing
        Else
            GD_REN_1.DataSource = Nothing
            GD_REN_1.DataBind()
        End If
    End Sub
End Class
