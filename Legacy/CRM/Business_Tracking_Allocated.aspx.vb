Imports System.Data
Imports System.Data.OleDb
Imports System.Data.SqlClient
Imports System.IO
Imports System.Runtime.CompilerServices
Imports System.Web.Configuration
Imports DocManage
Imports DocManage.DataManagement
Imports Mymail
Imports NPOI.Util
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
                Me.Session("empcode") = Nothing
                Me.Session("agentemail") = Nothing
                Me.Str = "SELECT [Sector_Code],[Sector_Name] FROM [dbo].[TBL_MIS_CRM_SECTORS]"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboSector As RadComboBox = Me.cboSector
                cboSector.Items.Clear()
                cboSector.DataSource = Me.MyDatatable
                cboSector.DataTextField = Me.MyDatatable.Columns("Sector_Name").ToString()
                cboSector.DataValueField = Me.MyDatatable.Columns("Sector_Code").ToString()
                cboSector.DataBind()
                Me.Str = "SELECT  [DOC_CODE],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where CODE IN (3,4)  order by DOC_ID asc"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cbodoc As RadComboBox = Me.cbodoc
                cbodoc.Items.Clear()
                cbodoc.DataSource = Me.MyDatatable
                cbodoc.DataTextField = Me.MyDatatable.Columns("DOC_NAME").ToString()
                cbodoc.DataValueField = Me.MyDatatable.Columns("DOC_CODE").ToString()
                cbodoc.DataBind()
                Me.Str = "SELECT USER_ID,AGENT_NAME FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] where ACTIVE=1  ORDER BY AGENT_NAME"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboagent As RadComboBox = Me.cboagent
                cboagent.Items.Clear()
                cboagent.DataSource = Me.MyDatatable
                cboagent.DataTextField = Me.MyDatatable.Columns("AGENT_NAME").ToString()
                cboagent.DataValueField = Me.MyDatatable.Columns("USER_ID").ToString()
                cboagent.DataBind()
                Me.Str = "SELECT COUNTY_CODE,COUNTY_NAME from [dbo].[TBL_MIS_COUNTY]"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboCounty As RadComboBox = Me.cboCounty
                cboCounty.Items.Clear()
                cboCounty.DataSource = Me.MyDatatable
                cboCounty.DataTextField = Me.MyDatatable.Columns("COUNTY_NAME").ToString()
                cboCounty.DataValueField = Me.MyDatatable.Columns("COUNTY_CODE").ToString()
                cboCounty.DataBind()

                Me.Str = "SELECT [Reason_Code] ,[Description]  FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_REASON]"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboriskreason As RadComboBox = Me.cboRiskReason
                cboriskreason.Items.Clear()
                cboriskreason.DataSource = Me.MyDatatable
                cboriskreason.DataTextField = Me.MyDatatable.Columns("Description").ToString()
                cboriskreason.DataValueField = Me.MyDatatable.Columns("Reason_Code").ToString()
                cboriskreason.DataBind()

                Me.loadGrid_N()
                Me.txtProposer.Enabled = False
                Me.cboBusiness.Enabled = False
                Me.cboclient.Enabled = False
                Me.txtCR12.Enabled = False
                Me.cboagent.Enabled = False
                Me.cbopayment.Enabled = False
                Me.cboCard.Enabled = False
                Me.cboCounty.Enabled = False
                Me.cbocategory.Enabled = False
                Me.cboSector.Enabled = False
                Me.cboBUS.Enabled = False
                Me.cborateType.Enabled = False
                Me.txt_PIN.Enabled = False
                Me.txtNID.Enabled = False
            Catch ex As Exception
                Me.lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()
        Me.GDTracking.DataSource = Nothing
        Me.GDTracking.DataBind()
        Me.SqlAction = "SELECT Product,Syst, [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,WALK_IN_CLIENT,Allocate_Dt,Lateral_Movement,Is_Branch  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Forwarded=1 AND Ready_For_Update=1  AND Allocated_to='" & Me.Session("username") & "' AND ALLOCATED=1 AND INVOICED=0  And Benefit_Verified='YES'  AND Is_Active=1 ORDER BY WALK_IN_CLIENT DESC,Allocate_Dt ASC"
        Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
        If Me.MyDatable.Rows.Count > 0 Then
            Me.GDTracking.DataSource = Me.MyDatable
            Me.GDTracking.DataBind()
            Me.Session("DAD_T_1") = Me.MyDatable
            Me.MyDatable = Nothing
        Else
            Me.GDTracking.DataSource = Nothing
            Me.GDTracking.DataBind()
        End If
        Me.SqlAction = "SELECT  [Refund_No],[File_No],[Amount_Paid],[Refund_Amt] ,[Payee_Name],[Payee_eMail],[Payee_Mobile],[Refund_Status],[Refund_Type],[Request_Dt],Entered_By,Client_Type FROM [CRM].[dbo].[TBL_MIS_BUSINESS_TRACKING_REFUNDS] WITH (NOLOCK) WHERE Requested=1 and Allocated =1 and Processed=0 and Allocate_To='" & Me.Session("username") & "'  AND Is_Active=1"
        Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
        If Me.MyDatable.Rows.Count > 0 Then
            Me.GDTrackingRef.DataSource = Me.MyDatable
            Me.GDTrackingRef.DataBind()
            Me.MyDatable = Nothing
        Else
            Me.GDTrackingRef.DataSource = Nothing
            Me.GDTrackingRef.DataBind()
        End If
    End Sub
    Public Sub loadGrid(STR As String)
        Dim dataTable As DataTable = New DataTable()
        Me.GD_DOCS.DataSource = Nothing
        Me.GD_DOCS.DataBind()
        Me.GDNOTES.DataSource = Nothing
        Me.GDNOTES.DataBind()
        Me.GD_PROPOSER.DataSource = Nothing
        Me.GD_PROPOSER.DataBind()
        Me.GD_Online_Pay.DataSource = Nothing
        Me.GD_Online_Pay.DataBind()
        GD_REN.DataSource = Nothing
        GD_REN.DataBind()
        GD_REN_1.DataSource = Nothing
        GD_REN_1.DataBind()
        Try
            Me.SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By],Doc_Ref FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" + STR + "' AND ACTIVE=1"
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
            Me.SqlAction = "SELECT [File_No],[Proposer_Name], Premium, Client_Type,Pay_Ref_No,Paid_Amt,File_Status  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Pay_Ref_No='" + Strings.Trim(Me.refno.Text) + "'  AND Is_Active=1"
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
            Me.SqlAction = " SELECT [code] ,[cover_type],[family_size],[plan_name],[plan_limit],[age_band],[premium_amount],[levy_vat],[levy_ext],[stamp_duty], [total_amount], [proposer_firstname]+' '+[proposer_lastname] proposer, [proposer_dob], [application_date]   FROM [DB_ONLINE_PORTAL].[dbo].[TBL_PORTAL_MIS_POLICY]   WITH (NOLOCK) WHERE  code='" + Strings.Trim(Me.FILE_NO.Text) + "'"
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
        Try
            If FILE_NO.Text = "" Then
                lblerr.Text = "Select the File!"
                Exit Sub
            End If

            If (Len(Trim(txtinv.Text)) > 25 Or Len(Trim(txtinv.Text)) < 20) And (cboAction.SelectedValue = "C" Or cboAction.SelectedValue = "RM") Then
                lblerr.Text = "Enter a Correct Invoice No."
                txtinv.Focus()
                txtinv.BackColor = Drawing.Color.Red
                Exit Sub
            End If

            If cboAction.SelectedValue = "" Then
                lblerr.Text = "Select the Action!"
                cboAction.Focus()
                cboAction.BackColor = Drawing.Color.Red
                Exit Sub
            End If
            'If cboAction.SelectedValue = "C" And cboAllocateto.SelectedValue = "" Then
            '    lblerr.Text = "Select the Forward To!"
            '    cboAllocateto.Focus()
            '    cboAllocateto.BackColor = Drawing.Color.Red
            '    Exit Sub
            'End If
            If txtcomment.Text = "" Then
                lblerr.Text = "Enter short notes!"
                Exit Sub
            End If
            If cboAction.SelectedValue = "C" And Trim(txtinv.Text) = "" Then
                lblerr.Text = "Enter the Invoice No."
                txtinv.Focus()
                txtinv.BackColor = Drawing.Color.Red
                Exit Sub
            End If

            If (cboAction.SelectedValue = "C" Or cboAction.SelectedValue = "RM" Or cboAction.SelectedValue = "CL") And cbopayment.SelectedValue = "" Then
                lblerr.Text = "Select the Payment status No."
                cbopayment.Focus()
                cbopayment.BackColor = Drawing.Color.Red
                Exit Sub
            End If

            If cboAction.SelectedValue = "RI" Then
                a_to = lblenteredby.Text
            Else
                a_to = lblenteredby.Text
            End If

            If cboAction.SelectedValue = "C" And (cboBusiness.SelectedValue = "N" Or cboBusiness.SelectedValue = "R") Then



            End If

            If Session("Declined") = 1 Then
                UpdateRecord("UPDATE CRM.dbo.[TBL_MIS_CRM_BUSINESS_TRACKING] SET  Ready_For_update=0,  File_Status='DECLINED',Refund_req=0, [Refund_Proc_Dt]= '" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',Refund_Proc_By='" & Session("username") & "' where [File_No]= '" & FILE_NO.Text & "'")
                Session("to") = lblenteredby.Text
                Session("email") = Session("email_cc")
                Session("msg") = "Kindly note that the above Refund has been Declined,reprocess."
            Else
                If cboAction.SelectedValue = "C" And (cboBusiness.SelectedValue = "N" Or cboBusiness.SelectedValue = "R") Then
                    'Check AML
                    ' SqlAction = "select File_No from [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] with(Nolock) where DOC_CODE='RET45' AND FILE_NO='" & FILE_NO.Text & "'"
                    SqlAction = "select File_No from [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] with(Nolock) where DOC_TITLE='AML REPORT' AND FILE_NO='" & FILE_NO.Text & "'"

                    MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                    If MyDatable.Rows.Count > 0 Then

                        MyDBAction.TRACKING_ALLOCATION_MSHIP(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"), a_to, txtcomment.Text, cboAction.SelectedValue, Trim(txtinv.Text))
                        If (cboAction.SelectedValue = "C" Or cboAction.SelectedValue = "CL") Then
                            If cbopayment.SelectedValue = "FULL-PAID" Then
                                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Invoice_Date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',  Paid_Status='FULL-PAID',Paid=1 where [File_No]= '" & FILE_NO.Text & "'")
                            ElseIf cbopayment.SelectedValue = "PART-PAID" Then
                                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Invoice_Date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',  Paid_Status='PART-PAID',Paid=1 where [File_No]= '" & FILE_NO.Text & "'")
                            ElseIf cbopayment.SelectedValue = "NOT-PAID" Then
                                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Invoice_Date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',  Paid_Status='NOT-PAID',Paid=0  where [File_No]= '" & FILE_NO.Text & "' and Syst='Clapi'")
                            Else
                                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  Invoice_Date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "', Paid_Status='FULL-PAID',Paid=1  where [File_No]= '" & FILE_NO.Text & "'")
                            End If
                        End If

                    Else
                        lblerr.Text = "You Must Upload AML Report!"
                        Exit Sub
                    End If

                Else
                    MyDBAction.TRACKING_ALLOCATION_MSHIP(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"), a_to, txtcomment.Text, cboAction.SelectedValue, Trim(txtinv.Text))
                    If (cboAction.SelectedValue = "C" Or cboAction.SelectedValue = "CL") Then
                        If cbopayment.SelectedValue = "FULL-PAID" Then
                            UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Invoice_Date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',  Paid_Status='FULL-PAID',Paid=1 where [File_No]= '" & FILE_NO.Text & "'")
                        ElseIf cbopayment.SelectedValue = "PART-PAID" Then
                            UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Invoice_Date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',  Paid_Status='PART-PAID',Paid=1 where [File_No]= '" & FILE_NO.Text & "'")
                        ElseIf cbopayment.SelectedValue = "NOT-PAID" Then
                            UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Invoice_Date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',  Paid_Status='NOT-PAID',Paid=0  where [File_No]= '" & FILE_NO.Text & "' and Syst='Clapi'")
                        Else
                            UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  Invoice_Date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "', Paid_Status='FULL-PAID',Paid=1  where [File_No]= '" & FILE_NO.Text & "'")
                        End If
                    End If

                End If




                Session("to") = ""
                If cboAction.SelectedValue = "C" Then
                    Session("to") = lblenteredby.Text
                    Session("email") = Session("email_cc") 'Cashiers email
                    Session("msg") = "Kindly note that this business has been Forwaded to cashier for receipting!"
                ElseIf cboAction.SelectedValue = "M" Then
                    Session("to") = lblenteredby.Text
                    Session("email") = "registry@(aar.co.ke"
                    Session("msg") = "Kindly note that the above business has been updated!"

                ElseIf cboAction.SelectedValue = "IT" Then
                    Session("to") = "IT Desk"
                    Session("email") = "IThelpdesk@aar.co.ke"
                    Session("msg") = "Kindly note that the above business has been Forwarded to IT for assistance!"
                ElseIf cboAction.SelectedValue = "RI" Then
                    Session("to") = lblenteredby.Text
                    Session("email") = Session("email_cc")
                    Session("msg") = "Kindly note that the above business has been Returned as Incomplete!"
                ElseIf cboAction.SelectedValue = "RM" Then
                    Session("to") = lblenteredby.Text
                    Session("email") = Session("email_cc")
                    Session("msg") = "Kindly note that the above business has been updated Pending payment.Debit Note has been attached on MIS for your reference.You are supposed to attach payment and forward to cashier for receipting."
                ElseIf cboAction.SelectedValue = "MU" Then
                    Session("to") = "Medical Team"
                    Session("email") = "medicalunderwriting@aar.co.ke"
                    Session("msg") = "Kindly note that the above business has been submitted for medical vetting"
                End If
            End If
            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd hh:mm"), txtcomment.Text)
            End If
            'Session("email") = "jmwaniki@aar.co.ke"
            MailSent = SendLoginDetails(lblenteredby.Text, Session("email"), Session("email_cc"))
            lblerr.Text = "Business updated successfully!"
            loadGrid_N()
            GD_DOCS.DataSource = Nothing
            GD_DOCS.DataBind()
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
            GD_Pay.DataSource = Nothing
            GD_Pay.DataBind()
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub
    Private Sub DeleteRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Delete)

    End Sub
    Protected Sub GDTracking_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDTracking.PageIndexChanged
        GDTracking.CurrentPageIndex = e.NewPageIndex
        GDTracking.DataSource = Session("DAD_T_1")
        GDTracking.DataBind()
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
    Protected Sub GDSEARCH_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GDTracking.DeleteCommand


        Try

            Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
            HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("DOC_ID").ToString()

            Dim MySqlAction As String = ""
            Dim MyDBAction As New DataManagement
            Dim MyDataTable As New Data.DataTable
            Dim File_No As String = ""
            Dim Proposer_Name As String = ""

            DeleteRecord("DELETE FROM   [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS]  WHERE DOC_ID='" & HiddenField1.Value.ToString & "' AND Upload_By='" & Session("UserName").ToString & "'")
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Business Tracking Delete", "Deleted Record :-   :" & HiddenField1.Value & " date:" & Date.Now() & ", Name - " & Session("FullNames") & ".", _
           Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            HiddenField1.Value = ""

            'ResetDisplayed("NewRecord")
            lblerr.Text = "Record Deleted!"
            'CmdSave.Enabled = False

            loadGrid_N()
            loadGrid(HiddenField1.Value.ToString)

        Catch ex As Exception


            Dim ErrMsg As String = ex.Message
        End Try
    End Sub
    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
        Try
            Me.ltEmbed.Text = ""
            Session("Pol_Code") = ""
            Me.HiddenField1.Value = 0
            Me.ID = CType(Me.GDTracking.SelectedItems(0), GridDataItem).GetDataKeyValue("File_No").ToString()
            Me.SqlAction = "SELECT [File_No],Pay_Ref_No,Paid_Amt,[Proposer_Name],[Family_code],Premium,File_Status,Business,Business_Type,Rate_Type,Receive_dt,entered_By,Agent_id,  Client_Type,Is_Mtiba,Benefit_verified,Benefit_Ver_by,Allocated_to,WALK_IN_CLIENT,eOx_Invoice_No,Is_Declined,Lateral_Movement,CR_12,County_Code,Category,Sector,PAY_MODE,CARD_TYPE,NID,PIN_NO,County_CODE,Pol_Code_Ren    FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" + Me.ID + "'"
            Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
            If Me.MyDatable.Rows.Count > 0 Then
                Me.FILE_NO.Text = Me.MyDatable.Rows(0)("File_No").ToString()
                Me.txtProposer.Text = Me.MyDatable.Rows(0)("Proposer_Name").ToString()
                Me.dtreceivedate.DbSelectedDate = Me.MyDatable.Rows(0)("Receive_dt").ToString()
                Me.cboBusiness.SelectedValue = Me.MyDatable.Rows(0)("Business_Type").ToString()
                Me.cboBUS.SelectedValue = Me.MyDatable.Rows(0)("Business").ToString()
                Me.cboclient.SelectedValue = Me.MyDatable.Rows(0)("Client_Type").ToString()
                Me.lblenteredby.Text = Me.MyDatable.Rows(0)("entered_By").ToString()
                Me.cboagent.SelectedValue = Me.MyDatable.Rows(0)("Agent_id").ToString()
                Me.LBLBEN.Text = Me.MyDatable.Rows(0)("Benefit_verified").ToString()
                Me.refno.Text = Me.MyDatable.Rows(0)("Pay_Ref_No").ToString()
                Me.txtpaid.Text = Me.MyDatable.Rows(0)("Paid_Amt").ToString()
                Me.txtinv.Text = Me.MyDatable.Rows(0)("eOx_Invoice_No").ToString()
                Me.Session("Declined") = Me.MyDatable.Rows(0)("Is_Declined").ToString()
                Me.chkwaiver.Checked = Me.MyDatable.Rows(0)("Lateral_Movement").ToString()
                Me.txtpaid.Text = Me.MyDatable.Rows(0)("Paid_Amt").ToString()
                Me.txtCR12.Text = Me.MyDatable.Rows(0)("CR_12").ToString()
                Me.cbocategory.SelectedValue = Me.MyDatable.Rows(0)("Category").ToString()
                Me.cboSector.SelectedValue = Me.MyDatable.Rows(0)("Sector").ToString()
                Me.cbopayment.SelectedValue = Me.MyDatable.Rows(0)("PAY_MODE").ToString()
                Me.cboCard.SelectedValue = Me.MyDatable.Rows(0)("CARD_TYPE").ToString()
                Me.txtNID.Text = Me.MyDatable.Rows(0)("NID").ToString()
                Me.txt_PIN.Text = Me.MyDatable.Rows(0)("PIN_NO").ToString()
                Me.cboCounty.SelectedValue = Me.MyDatable.Rows(0)("County_Code").ToString()
                Me.cborateType.SelectedValue = Me.MyDatable.Rows(0)("Rate_Type").ToString()
                Session("Pol_Code") = Me.MyDatable.Rows(0)("Pol_Code_Ren").ToString()
                Me.loadGrid(Me.FILE_NO.Text)
                Me.Str = "SELECT EMAIL FROM employees WHERE username='" + Me.lblenteredby.Text + "'"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                If Me.MyDatatable.Rows.Count > 0 Then
                    Me.Session("email_CC") = Me.MyDatatable.Rows(0)("EMAIL").ToString()
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
            If Me.LBLBEN.Text = "NO" Then
                Me.btnforward.Enabled = False
                Me.txtcomment.Enabled = False
            Else
                Me.btnforward.Enabled = True
                Me.txtcomment.Enabled = True
            End If
            Me.cbopayment.Enabled = True
        Catch ex As Exception
            Me.lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try
            ltEmbed.Text = ""
            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,Allocate_Dt  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND INVOICED=0 AND  Is_Declined=0  AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,Allocate_Dt  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%'  AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND INVOICED=0 AND Is_Declined=0  AND Is_Active=1"
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
    Protected Sub cboAction_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboAction.SelectedIndexChanged
        cboAllocateto.SelectedValue = ""
        cboAllocateto.Text = ""
        ltEmbed.Text = ""
        If cboAction.SelectedValue = "RI" Then
            cboAllocateto.Enabled = False
        ElseIf cboAction.SelectedValue = "MU" Then
            cboAllocateto.Enabled = True
            Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  Activated=1 AND approved=1 AND Deleted=0 AND Department='MEDICAL UNDERWRITING'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboAllocateto
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("EmployeeName").ToString
                .DataValueField = MyDatatable.Columns("username").ToString
                .DataBind()
            End With
        ElseIf cboAction.SelectedValue = "C" Then
            cboAllocateto.Enabled = True
            Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  Activated=1 AND approved=1 AND Deleted=0 AND Department='FINANCE'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboAllocateto
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("EmployeeName").ToString
                .DataValueField = MyDatatable.Columns("username").ToString
                .DataBind()
            End With
        ElseIf cboAction.SelectedValue = "IT" Then
            cboAllocateto.Enabled = True
            Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  Activated=1 AND approved=1 AND Deleted=0 AND Department='IT'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboAllocateto
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("EmployeeName").ToString
                .DataValueField = MyDatatable.Columns("username").ToString
                .DataBind()
            End With
        ElseIf cboAction.SelectedValue = "RM" Then
            cboAllocateto.Enabled = True
            Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  Activated=1 AND approved=1 AND Deleted=0 AND Department='RETENTION'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboAllocateto
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("EmployeeName").ToString
                .DataValueField = MyDatatable.Columns("username").ToString
                .DataBind()
            End With
        End If

    End Sub
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
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b><u>ATT:" & Session("to") & " </u></b> </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            MessageSubject = "'" & txtProposer.Text & "-" & FILE_NO.Text & " ' "
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>" & Session("msg") & " </b></span>")

            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>File No:" & FILE_NO.Text & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Client Name: " & txtProposer.Text & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Pay Status: " & cbopayment.SelectedValue & " </b></span>")
            strHTML = strHTML.Append("<br />")

            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Date : " & Date.Now() & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Update By : " & Session("FullNames") & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("----------------------------------------Notes--------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("" & txtcomment.Text & "")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("----------------------------------------End--------------------------------------------------------------------")
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

    Protected Sub btnupload_Click(sender As Object, e As System.EventArgs) Handles btnupload.Click
        Dim MyDatable As New Data.DataTable
        Dim STS As Integer
        Dim aar As Integer = 0
        Dim PROPOSER_ID As String
        Dim PERIOD As String
        Dim FILENO As String

        lblupload.Text = ""
        'ltEmbed.Text = ""
        Try
            If FILE_NO.Text = "" Then
                lblerr.Text = "You must Select The file!"
                Exit Sub
            End If

            If cbodoc.SelectedValue = "RET30" Then
                If (Len(Trim(txtinv.Text)) > 25 Or Len(Trim(txtinv.Text)) < 20) And (cboAction.SelectedValue = "C" Or cboAction.SelectedValue = "RM") Then
                    lblerr.Text = "Enter a single Invoice No."
                    txtinv.Focus()
                    txtinv.BackColor = Drawing.Color.Red
                    Exit Sub
                End If
            End If


            If cbodoc.SelectedValue = "RET43" Then

                If cboRate.SelectedValue = "" Or cboRiskReason.SelectedValue = "" Then
                    lblerr.Text = "Select Risk Rating and Reason!"
                    cboRate.Focus()
                    Exit Sub
                End If
            End If


            If FL1.PostedFile.FileName = "" Then
                lblerr.Text = "You must upload a reference pdf file!"
                Exit Sub
            End If
            If cbodoc.Text = "" Then
                lblerr.Text = "You must Select Document title!"
                Exit Sub
            End If

            Dim filePath As String = FL1.PostedFile.FileName
            Dim filename As String = Path.GetFileName(filePath)
            Dim ext As String = Path.GetExtension(filename)
            Dim contenttype As String = String.Empty
            Dim fs As Stream = FL1.PostedFile.InputStream
            Dim br As New BinaryReader(fs)
            Dim bytes As Byte() = br.ReadBytes(DirectCast(fs.Length, Long))

            Dim app As Integer = 0

            Select Case ext
                Case ".doc"
                    contenttype = "application/vnd.ms-word"
                    Exit Select
                Case ".docx"
                    contenttype = "application/vnd.ms-word"
                    Exit Select
                Case ".xls"
                    contenttype = "application/vnd.ms-excel"
                    Exit Select
                Case ".xlsx"
                    contenttype = "application/vnd.ms-excel"
                    Exit Select
                Case ".jpg"
                    contenttype = "image/jpg"
                    Exit Select
                Case ".png"
                    contenttype = "image/png"
                    Exit Select
                Case ".gif"
                    contenttype = "image/gif"
                    Exit Select
                Case ".pdf"
                    contenttype = "application/pdf"
                    Exit Select
                Case ".rar"
                    contenttype = "application/zip"
                    Exit Select
                Case ".zip"
                    contenttype = "application/zip"
                    Exit Select
            End Select

            If contenttype <> String.Empty Then
                Dim fileLocation As String = ""
                MyDBAction.UPLOAD_File_DOC_INVOIC(bytes, filename, contenttype, FILE_NO.Text, Trim(cbodoc.Text.ToUpper), CDate(Date.Now()).ToString("yyyy-MM-dd"), Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), cbodoc.SelectedValue, Trim(txtinv.Text))
                'Response.Redirect(Request.Url.AbsoluteUri)


                If cbodoc.SelectedValue = "RET27" Then
                    MyDBAction.TRACKING_CREDIT_NOTES(FILE_NO.Text, Trim(txtinv.Text.ToUpper), txtamount.Text, Session("username"), lblenteredby.Text, CDate(Date.Now).ToString("yyyy-MM-dd"))
                ElseIf cbodoc.SelectedValue = "RET30" Then
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET eOx_Invoice_No='" & Trim(txtinv.Text) & "',Policy_Code='" & Trim(txtpolicy.Text) & "' where [File_No]= '" & FILE_NO.Text & "'")
                ElseIf cbodoc.SelectedValue = "RET43" Then
                    MyDBAction.TRACKING_AML_RISKS(FILE_NO.Text, Trim(txtinv.Text.ToUpper), txtProposer.Text, txtpolicy.Text, cboclient.Text, "eOx", cboRate.SelectedValue, cboRiskReason.SelectedValue, Session("username"))
                End If

                SqlAction = "SELECT [eOx_Invoice_No]   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & FILE_NO.Text & "'"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    txtinv.Text = MyDatable.Rows(0).Item("eOx_Invoice_No").ToString()
                End If
                lblupload.ForeColor = System.Drawing.Color.Green
                lblupload.Text = "File uploaded successfully"
            Else
                lblupload.Text = "File format not recognised." _
            & " Upload Image/Word/PDF/Excel formats"
            End If
            loadGrid(FILE_NO.Text)



        Catch ex As Exception
            lblerr.Text = ex.Message
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
            Dim myCell As TableCell = dataItem("WALK_IN_CLIENT")
            If myCell.Text = "Y" Then
                dataItem.BackColor = Drawing.Color.Green
            End If


            myCell = dataItem("Lateral_Movement")
            If myCell.Text = "1" Then
                dataItem.BackColor = Drawing.Color.LightBlue
                'dataItem.ForeColor = Drawing.Color.Red
            End If
            Dim myCell_1 As TableCell = dataItem("Is_Branch")

            If myCell_1.Text = 2 Then
                dataItem.BackColor = Drawing.Color.Brown
                'dataItem.ForeColor = Drawing.Color.Red
            End If
            Dim myCell_2 As TableCell = dataItem("Syst")

            If myCell_2.Text = "Shwaari" Then
                dataItem.BackColor = Drawing.Color.Green
                'dataItem.ForeColor = Drawing.Color.Red
            End If
        End If
    End Sub

   
    Protected Sub cmdview_Click(sender As Object, e As System.EventArgs) Handles cmdview.Click
        Try
            GDPROP.DataSource = Nothing
            GDPROP.DataBind()
            GDMEM.DataSource = Nothing
            GDMEM.DataBind()
            Dim MyDatable As New Data.DataTable
            ' SqlAction = "SELECT[PROPOSER_ID],[DISPLAY_MEMBERSHIP_NO],[MEMBER_NAME],[RELATION],[SCHEME_NAME],[MEMBER_BIRTH_DATE],[MEMBER_ADMINISTRATIVE_SEX],[MEMBER_PRI_MOBILE],[MEMBER_PRI_EMAIL],[USER_ID] FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST]  WHERE PROPOSER_ID ='" & PRD.Text & "' order by DISPLAY_MEMBERSHIP_NO"
            If cbotype.SelectedValue = "R" Then
                If cbosearch_1.SelectedValue = "F" Then
                    SqlAction = "SELECT FAMILY_NO, [PROPOSER_ID],POLICY_CODE,PROPOSER_DISPLAY_NAME ,AGENT,POLICY_VALID_FROM [PERIOD_FROM],POLICY_VALID_UPTO PERIOD_TO,POLICY_STATUS,RM_NAME FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST]   WITH (NOLOCK)  WHERE ltrim(rtrim(FAMILY_NO))  ='" & Trim(TXTSEARCH_1.Text) & "' AND RELATION='MAIN MEMBER'"
                ElseIf cbosearch_1.SelectedValue = "PN" Then
                    SqlAction = "SELECT FAMILY_NO,[PROPOSER_ID],POLICY_CODE,PROPOSER_DISPLAY_NAME ,AGENT,POLICY_VALID_FROM [PERIOD_FROM],POLICY_VALID_UPTO PERIOD_TO,POLICY_STATUS,RM_NAME FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST] WITH(NOLOCK)  WHERE PROPOSER_DISPLAY_NAME  LIKE '%" & Trim(TXTSEARCH_1.Text) & "%'  AND RELATION='MAIN MEMBER'"
                ElseIf cbosearch_1.SelectedValue = "PC" Then
                    SqlAction = "SELECT FAMILY_NO,[PROPOSER_ID],POLICY_CODE,PROPOSER_DISPLAY_NAME ,AGENT,POLICY_VALID_FROM [PERIOD_FROM],POLICY_VALID_UPTO PERIOD_TO,POLICY_STATUS,RM_NAME FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST] WITH(NOLOCK)  WHERE  POLICY_CODE  = '" & Trim(TXTSEARCH_1.Text) & "'"
                Else
                    lblerr.Text = "Invalid Search type!"
                End If

            Else
                If cbosearch_1.SelectedValue = "PN" Then
                    SqlAction = "SELECT DISTINCT PROPOSER_ID,POLICY_CODE,PROPOSER_DISPLAY_NAME,PERIOD_FROM,PERIOD_TO,RM_NAME,POLICY_STATUS FROM [DATA_REPOSITORY_DB].[dbo].MASTER_PROPOSER_LIST WITH (NOLOCK)  WHERE PROPOSER_DISPLAY_NAME LIKE '%" & Trim(TXTSEARCH_1.Text) & "%' AND POLICY_STATUS<>'TERMINATED'"

                ElseIf cbosearch_1.SelectedValue = "PC" Then
                    SqlAction = "SELECT DISTINCT PROPOSER_ID,POLICY_CODE,PROPOSER_DISPLAY_NAME,PERIOD_FROM,PERIOD_TO,RM_NAME,POLICY_STATUS FROM [DATA_REPOSITORY_DB].[dbo].MASTER_PROPOSER_LIST WITH (NOLOCK)  WHERE POLICY_CODE = '" & Trim(TXTSEARCH_1.Text) & "' AND POLICY_STATUS<>'TERMINATED'"

                Else
                    lblerr.Text = "Invalid Search type!"
                End If
            End If

            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDPROP.DataSource = MyDatable
                GDPROP.DataBind()
                Session("TAT_5") = MyDatable
                'RMNAME.Text = MyDatable.Rows(0).Item("RM_NAME").ToString
                MyDatable = Nothing
            Else
                GDPROP.DataSource = Nothing
                GDPROP.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    Protected Sub GDPROP_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDPROP.SelectedIndexChanged
        Try
            GDMEM.DataSource = Nothing
            GDMEM.DataBind()
            Session("POLICY_CODE") = Nothing
       
            Session("FAMILY_NO") = Nothing
            Session("PERIOD_FROM") = Nothing
            Session("PERIOD_TO") = Nothing
            Dim DR As Decimal = 0
            Dim CR As Decimal = 0

            Session("POLICY_CODE") = (DirectCast(GDPROP.SelectedItems(0), GridDataItem)).GetDataKeyValue("POLICY_CODE").ToString()

            SqlAction = "SELECT [POLICY_CODE],[DISPLAY_MEMBERSHIP_NO],FAMILY_NO,MEMBER_PREFIX,[MEMBER_NAME],FIRST_ENROLLMENT_DATE,[RELATION],[SCHEME_NAME],[MEMBER_BIRTH_DATE],[MEMBER_ADMINISTRATIVE_SEX],[MEMBER_PRI_MOBILE],[MEMBER_PRI_EMAIL],POLICY_VALID_FROM ,POLICY_VALID_UPTO ,POLICY_STATUS,DATA_DATE,PERIOD_FROM,PERIOD_TO,ID_DOC_NO FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST]  with(nolock) WHERE POLICY_CODE ='" & Session("POLICY_CODE") & "'   order by DISPLAY_MEMBERSHIP_NO"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDMEM.DataSource = MyDatable
                GDMEM.DataBind()
                Session("TAT_5") = MyDatable
                Session("POLICY_CODE") = MyDatable.Rows(0).Item("POLICY_CODE").ToString()
                LBLID.Text = MyDatable.Rows(0).Item("POLICY_CODE").ToString

                Session("PERIOD_FROM") = MyDatable.Rows(0).Item("PERIOD_FROM").ToString
                Session("PERIOD_TO") = MyDatable.Rows(0).Item("PERIOD_TO").ToString
                MyDatable = Nothing
            Else
                GDMEM.DataSource = Nothing
                GDMEM.DataBind()
            End If
 
 
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    'Public Sub LoadNotes(ByVal id As String)
    '    SqlAction = "SELECT [Note_id],[Notes],[Notes_by],[Note_Date],[Note_Type] FROM  [DATA_REPOSITORY_DB].[dbo].[MASTER_RET_MEMBER_NOTES] WHERE  proposer_id ='" & id & "'  ORDER BY Note_id DESC"
    '    MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
    '    If MyDatable.Rows.Count > 0 Then
    '        GDNOTES.DataSource = MyDatable
    '        GDNOTES.DataBind()
    '        MyDatable = Nothing
    '    Else
    '        GDNOTES.DataSource = MyDatable
    '        GDNOTES.DataBind()
    '    End If
    'End Sub


    Protected Sub GDMEM_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDMEM.SelectedIndexChanged
        Try
            Dim number As String = ""
          
            number = (DirectCast(GDMEM.SelectedItems(0), GridDataItem)).GetDataKeyValue("DISPLAY_MEMBERSHIP_NO").ToString()

          

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub

    Protected Sub cmdview_1_Click(sender As Object, e As System.EventArgs) Handles cmdview_1.Click
        Dim Str As String = "" : Dim Mytable As DataTable = Nothing
        Dim Reportname As String = "Member_" & Session("POLICY_CODE") & ""
        Try
            SqlAction = "SELECT  [POLICY_CODE],[PROPOSER_DISPLAY_NAME],[DISPLAY_MEMBERSHIP_NO],[MEMBER_NAME],[RELATION],[SCHEME_NAME],FORMAT(MEMBER_BIRTH_DATE, 'dd/MMM/yyyy')[MEMBER_BIRTH_DATE],[MEMBER_ADMINISTRATIVE_SEX],[MEMBER_FNAME],[MEMBER_LNAME],FORMAT (FIRST_ENROLLMENT_DATE, 'dd/MMM/yyyy ')[FIRST_ENROLLMENT_DATE],[POLICY_VALID_FROM],[POLICY_VALID_UPTO],[AGENT],[MEMBER_PRI_ADD_LINE1],[MEMBER_PRI_ADD_LINE2],+''''+ [MEMBER_PRI_MOBILE] [MEMBER_PRI_MOBILE],[MEMBER_PRI_EMAIL] ,[PERIOD_FROM],[PERIOD_TO],[POLICY_STATUS],[FAMILY_NO],[DATA_DATE],[ID_DOC_NO],[CARD_TYPE],[MEMBER_PIN],[COVER_TYPE] FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST] WITH(NOLOCK) where POLICY_STATUS<>'TERMINATED'  AND POLICY_CODE='" & Session("POLICY_CODE") & "'"
            Session("EXCEL") = "TO EXCEL"
            Mytable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            Session("Mytable") = (Mytable)
            Session("Reportname") = Reportname
            ResponseHelper.Redirect("Reports.aspx", "_blank", "")
            Mytable = Nothing
            System.Threading.Thread.Sleep(5000)
            'Reportname = ""
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub


End Class
