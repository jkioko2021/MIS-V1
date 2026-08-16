<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_Tracking.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Medium"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div align="center">
                    
                    <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                        Width="1176px">
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                                      <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" Width="1170px">
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="BUSINESS TRACKING" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td style="width: 1025px" align="right">
                                                    <asp:Label ID="Label141" runat="server" Text="Search by"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    <telerik:RadComboBox ID="cbosearch" Runat="server" AllowCustomText="True" 
                                                        AutoPostBack="True" MarkFirstMatch="True" Skin="Sunset" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Text="Proposer Name" Value="P" />
                                                            <telerik:RadComboBoxItem runat="server" Text="File No." Value="F" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 264px">
                                                    <telerik:RadTextBox ID="txtsearch" Runat="server" Skin="Sunset" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td>
                                                    <telerik:RadButton ID="btnsearch" runat="server" Text="Search" Skin="Simple">
                                                    </telerik:RadButton>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Panel ID="Panel11" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GDTracking" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="30" Skin="Sunset" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                        UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
                                                                        <telerik:GridBoundColumn DataField="Receive_dt" 
                                                                        FilterControlAltText="Filter Receive_dt column" HeaderText="Receive_dt" 
                                                                        SortExpression="Receive_dt" UniqueName="Receive_dt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="File_No" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                        FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                        SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                    </telerik:GridBoundColumn>
                                                                   <telerik:GridBoundColumn DataField="Client_Type" 
                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                    </telerik:GridBoundColumn>    
                                                                    <telerik:GridBoundColumn DataField="Business_Type" 
                                                                        FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                        SortExpression="Business_Type" UniqueName="Business_Type">
                                                                    </telerik:GridBoundColumn>                                                   
                                                                    <telerik:GridBoundColumn DataField="File_Status" 
                                                                        FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                        SortExpression="File_Status" UniqueName="File_Status">
                                                                    </telerik:GridBoundColumn>
                                                              <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                            ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                            Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                            <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                            <ItemStyle CssClass="ButtonColumn" />
                                                        </telerik:GridButtonColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <telerik:RadTabStrip ID="RadTabStrip1" runat="server" 
                                            MultiPageID="RadMultiPage1" SelectedIndex="0" Skin="Sunset" Width="100%">
                                            <Tabs>
                                                <telerik:RadTab runat="server" Text="Register" Selected="True" 
                                                    SelectedIndex="0">
                                                </telerik:RadTab>
                                                <telerik:RadTab runat="server" Text="Documentation">
                                                </telerik:RadTab>
                                                <telerik:RadTab runat="server" PageViewID="V3" Text="Payment Info">
                                                </telerik:RadTab>
                                            </Tabs>
                                        </telerik:RadTabStrip>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="1100px">
                                            <telerik:RadPageView ID="V1" runat="server" Selected="True">
                                                <asp:Panel ID="Panel29" runat="server">
                                                    <table style="width: 100%">
                                                        <tr>
                                                            <td bgcolor="#999999" colspan="4">
                                                                <asp:Label ID="Label148" runat="server" Text="Details"></asp:Label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                <asp:Label ID="Label32" runat="server" Text="Receive Date"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadDatePicker ID="dtreceivedate" Runat="server" Enabled="False" 
                                                                    MinDate="" Skin="Web20">
                                                                    <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                    </Calendar>
                                                                    <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                    </DateInput>
                                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                </telerik:RadDatePicker>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                <asp:Label ID="Label150" runat="server" Text="Business"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadComboBox ID="cboBUS" Runat="server" Skin="Sunset" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBUS" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Medical" Value="M" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Non Medical" Value="N" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                <asp:Label ID="Label149" runat="server" Text="Client Type"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadComboBox ID="cboclient" Runat="server" Skin="Sunset" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboclient" Text="Retail" 
                                                                            Value="R" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboclient" Text="SME" 
                                                                            Value="S" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboclient" Text="Corporate" 
                                                                            Value="C" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                <asp:Label ID="Label171" runat="server" Text="Rate Type"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadComboBox ID="cborateType" Runat="server" Skin="Sunset" 
                                                                    Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cborateType" 
                                                                            Text="Standard Rates" Value="S" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cborateType" Text="Custom Rates" 
                                                                            Value="C" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                <asp:Label ID="Label10" runat="server" Text="Business Type"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadComboBox ID="cboBusiness" Runat="server" MarkFirstMatch="True" 
                                                                    Skin="Sunset" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="New" 
                                                                            Value="N" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Renewal" 
                                                                            Value="R" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Addon" Value="A" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Termination" 
                                                                            Value="T" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" 
                                                                            Text="Reinstatement" Value="RT" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Category Change" Value="CC" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Premium Recon" Value="PR" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Nill_Endr" Value="NE" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Fund_Topup" Value="FT" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Suspension" Value="SU" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Lift Suspension" Value="LS" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="text-align: left; width: 271px">
                                                                <asp:Label ID="Label30" runat="server" Text="Proposer Name"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadTextBox ID="txtProposer" Runat="server" Skin="Sunset" Width="250px">
                                                                </telerik:RadTextBox>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                <asp:Label ID="Label142" runat="server" Text="Family Code"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadTextBox ID="txtFamily" Runat="server" Skin="Sunset" Width="150px">
                                                                </telerik:RadTextBox>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                <asp:Label ID="Label14" runat="server" Text="Agent/Broker"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadComboBox ID="cboagent" Runat="server" AccessibilityMode="True" 
                                                                    AllowCustomText="True" MarkFirstMatch="True" Skin="Sunset" Width="300px">
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td style="text-align: left">
                                                                <asp:CheckBox ID="chkmtiba" runat="server" Text="Is Mtiba" />
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                <asp:Label ID="Label168" runat="server" Text="Benefits"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadComboBox ID="cbobenefit" Runat="server" Skin="Sunset" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cbobenefit" Text="IP/OP" 
                                                                            Value="IP/OP" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="IP Only" Value="IP" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="OP Only" Value="OP" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="NonMed" Value="NonMed" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                <asp:Label ID="Label13" runat="server" Text="Premium Amt"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadNumericTextBox ID="txtpremium" Runat="server" Culture="en-US" 
                                                                    Skin="Sunset" Value="0" Width="200px">
                                                                </telerik:RadNumericTextBox>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="text-align: left; width: 271px">
                                                                <asp:Label ID="Label169" runat="server" Text="Cheque No"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadTextBox ID="txtrefno" Runat="server" Skin="Sunset" Width="200px">
                                                                </telerik:RadTextBox>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="text-align: left; width: 271px">
                                                                <asp:Label ID="Label172" runat="server" Text="Amt To Receipt"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadNumericTextBox ID="txtreceiptamt" Runat="server" Culture="en-US" 
                                                                    Skin="Sunset" Value="0" Width="200px">
                                                                </telerik:RadNumericTextBox>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td style="text-align: left">
                                                                <asp:CheckBox ID="chkipf" runat="server" Font-Size="Medium" 
                                                                    Text="Is IPF Business" Enabled="False" />
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td style="text-align: left">
                                                                <asp:CheckBox ID="chkbranch" runat="server" Enabled="False" Font-Bold="True" 
                                                                    Font-Size="Large" ForeColor="Red" Text="Shwaari Product" />
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td style="text-align: left">
                                                                <asp:CheckBox ID="chkwalkin" runat="server" Font-Size="Medium" 
                                                                    style="color: #FF0000; background-color: #FFFFFF" 
                                                                    Text="Walk-in Client (Customer Service Only)" />
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="text-align: left; width: 271px">
                                                                <asp:Label ID="Label170" runat="server" Text="Membership Admin"></asp:Label>
                                                            </td>
                                                            <td style="text-align: left">
                                                                <telerik:RadComboBox ID="cbomship" Runat="server" AccessibilityMode="True" 
                                                                    AllowCustomText="True" MarkFirstMatch="True" Skin="Sunset" Width="300px">
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 155px; text-align: left;">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="4">
                                                                <hr style="width: 1128px" />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px">
                                                                &nbsp;</td>
                                                            <td colspan="2">
                                                                <asp:Label ID="Label153" runat="server" Font-Bold="True" 
                                                                    style="font-style: italic" 
                                                                    Text="Related Documents can be attached as a Zip file"></asp:Label>
                                                            </td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="text-align: left; width: 271px">
                                                                <asp:Label ID="Label143" runat="server" Text="Documents Requirements "></asp:Label>
                                                            </td>
                                                            <td>
                                                                <asp:Panel ID="Panel31" runat="server" BorderStyle="Dotted" BorderWidth="1px" 
                                                                    Height="100%" Width="100%">
                                                                    <asp:CheckBoxList ID="chklist" runat="server" Width="391px" Font-Bold="True" 
                                                                        Font-Size="Medium" ForeColor="#CC0000">
                                                                    </asp:CheckBoxList>
                                                                </asp:Panel>
                                                            </td>
                                                            <td style="width: 155px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px">
                                                                <asp:Label ID="Label152" runat="server" Text="NB;"></asp:Label>
                                                            </td>
                                                            <td>
                                                                &nbsp;</td>
                                                            <td style="width: 155px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                            <td style="width: 155px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="height: 36px;" colspan="3">
                                                                <telerik:RadButton ID="btnsave" runat="server" Skin="Simple" Text="Save" 
                                                                    Width="150px">
                                                                </telerik:RadButton>
                                                                &nbsp;
                                                                <telerik:RadButton ID="btnedit" runat="server" Skin="Simple" Text="Edit" 
                                                                    Width="150px">
                                                                </telerik:RadButton>
                                                                &nbsp;<telerik:RadButton ID="btnnew" runat="server" Skin="Simple" Text="New" 
                                                                    Width="150px">
                                                                </telerik:RadButton>
                                                            </td>
                                                            <td style="height: 36px">
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 271px">
                                                                &nbsp;</td>
                                                            <td>
                                                                <asp:Label ID="lblsave" runat="server" Font-Bold="True" ForeColor="Red" 
                                                                    Font-Size="Medium"></asp:Label>
                                                            </td>
                                                            <td style="width: 155px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                    </table>
                                                </asp:Panel>
                                            </telerik:RadPageView>
                                            <telerik:RadPageView ID="V2" runat="server" Width="1144px">
                                                <asp:Panel ID="Panel2" runat="server">
                                                    <table style="width: 99%">
                                                        <tr>
                                                            <td colspan="4">
                                                                <asp:Label ID="Label147" runat="server" Font-Bold="True" Text="Documentation"></asp:Label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="4">
                                                                <asp:Panel ID="Panel30" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1100px">
                                                                    <telerik:RadGrid ID="GD_DOCS" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                        GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                                        <MasterTableView AutoGenerateColumns="False" DataKeyNames="DOC_ID">
                                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </RowIndicatorColumn>
                                                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </ExpandCollapseColumn>
                                                                            <Columns>
                                                                                <telerik:GridButtonColumn CommandName="Select" 
                                                                                    FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                                    UniqueName="Select">
                                                                                    <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                                    <ItemStyle Width="50px" />
                                                                                </telerik:GridButtonColumn>
                                                                                <telerik:GridBoundColumn DataField="DOC_ID" 
                                                                                    FilterControlAltText="Filter DOC_ID column" HeaderText="DOC_ID" 
                                                                                    SortExpression="DOC_ID" UniqueName="DOC_ID">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="File_No" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Doc_Title" 
                                                                                    FilterControlAltText="Filter Doc_Title column" HeaderText="Doc_Title" 
                                                                                    SortExpression="Doc_Title" UniqueName="Doc_Title">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Doc_Date" 
                                                                                    FilterControlAltText="Filter Doc_Date column" HeaderText="Doc_Date" 
                                                                                    SortExpression="Doc_Date" UniqueName="Doc_Date">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="File_Name" 
                                                                                    FilterControlAltText="Filter File_Name column" HeaderText="File_Name" 
                                                                                    SortExpression="File_Name" UniqueName="File_Name">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Upload_By" 
                                                                                    FilterControlAltText="Filter Upload_By column" HeaderText="Upload_By" 
                                                                                    SortExpression="Upload_By" UniqueName="Upload_By">
                                                                                </telerik:GridBoundColumn>
                                                                              
                                                                            </Columns>
                                                                            <EditFormSettings>
                                                                                <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                </EditColumn>
                                                                            </EditFormSettings>
                                                                        </MasterTableView>
                                                                        <FilterMenu EnableImageSprites="False">
                                                                        </FilterMenu>
                                                                        <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                        </HeaderContextMenu>
                                                                    </telerik:RadGrid>
                                                                </asp:Panel>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <asp:Label ID="Label145" runat="server" Text="Document Title"></asp:Label>
                                                            </td>
                                                            <td style="height: 35px; text-align: left;">
                                                                <telerik:RadTextBox ID="txttitle" Runat="server" Skin="Sunset" Width="300px" 
                                                                    Enabled="False">
                                                                </telerik:RadTextBox>
                                                            </td>
                                                            <td style="width: 155px; height: 35px;">
                                                                <asp:Label ID="DOC_ID" runat="server" 
                                                                    style="font-weight: 700; color: #CC0000; background-color: #FFFFFF" 
                                                                    Visible="False"></asp:Label>
                                                            </td>
                                                            <td style="height: 35px">
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="text-align: left">
                                                                <asp:Label ID="Label146" runat="server" Text="Document"></asp:Label>
                                                            </td>
                                                            <td style="height: 35px; text-align: left;">
                                                                <asp:FileUpload ID="FL1" runat="server" Width="330px" />
                                                            </td>
                                                            <td style="width: 155px; height: 35px;">
                                                                <asp:Label ID="Label138" runat="server" Text="Upload Date"></asp:Label>
                                                            </td>
                                                            <td style="height: 35px">
                                                                <telerik:RadDatePicker ID="dtupload" Runat="server" MinDate="" Skin="Sunset" 
                                                                    Enabled="False">
                                                                    <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                    </Calendar>
                                                                    <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                    </DateInput>
                                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                </telerik:RadDatePicker>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 24px; height: 35px;">
                                                                &nbsp;</td>
                                                            <td style="height: 35px">
                                                                <telerik:RadButton ID="btnupload" runat="server" Skin="Simple" Text="Upload" 
                                                                    Width="150px">
                                                                </telerik:RadButton>
                                                                &nbsp; </td>
                                                            <td style="width: 155px; height: 35px;">
                                                                &nbsp;</td>
                                                            <td style="height: 35px">
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="4" style="height: 35px;">
                                                                <asp:Label ID="lblupload" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                                    ForeColor="Red"></asp:Label>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </asp:Panel>
                                            </telerik:RadPageView>
                                             <telerik:RadPageView ID="V3" runat="server" Width="1144px">
                                                <asp:Panel ID="Panel3" runat="server">
                                                    <table style="width: 99%">
                                                        <tr>
                                                            <td>
                                                                <asp:Label ID="Label1" runat="server" Font-Bold="True" Text="Payment Details"></asp:Label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <asp:Panel ID="Panel32" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1128px">
                                                                    <telerik:RadGrid ID="GD_Pay" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                        GridLines="None" Height="100%" PageSize="20" Skin="Sunset" Width="100%">
                                                                        <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </RowIndicatorColumn>
                                                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </ExpandCollapseColumn>
                                                                            <Columns>
                                                                                <telerik:GridBoundColumn DataField="File_No" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                                    FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                                    SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Client_Type" 
                                                                                    FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                                    SortExpression="Client_Type" UniqueName="Client_Type">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Premium" DataFormatString="{0:### ##0.0}" 
                                                                                    FilterControlAltText="Filter Premium column" HeaderText="Premium" 
                                                                                    SortExpression="Premium" UniqueName="Premium">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Paid_Amt" DataFormatString="{0:### ##0.0}" 
                                                                                    FilterControlAltText="Filter Paid_Amt column" HeaderText="Paid_Amt" 
                                                                                    SortExpression="Paid_Amt" UniqueName="Paid_Amt">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Pay_Ref_No" 
                                                                                    FilterControlAltText="Filter Pay_Ref_No column" HeaderText="Pay_Ref_No" 
                                                                                    SortExpression="Pay_Ref_No" UniqueName="Pay_Ref_No">
                                                                                </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="File_Status" 
                                                                                    FilterControlAltText="Filter File_Status column" HeaderText="File_Status" 
                                                                                    SortExpression="File_Status" UniqueName="File_Status">
                                                                                </telerik:GridBoundColumn>
                                                                            </Columns>
                                                                            <EditFormSettings>
                                                                                <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                </EditColumn>
                                                                            </EditFormSettings>
                                                                        </MasterTableView>
                                                                        <ItemStyle Wrap="False" />
                                                                        <FilterMenu EnableImageSprites="False">
                                                                        </FilterMenu>
                                                                        <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                        </HeaderContextMenu>
                                                                    </telerik:RadGrid>
                                                                </asp:Panel>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <asp:Label ID="Label173" runat="server" Text="Total Paid Amt:"></asp:Label>
                                                                &nbsp;<telerik:RadNumericTextBox ID="txtpaid" Runat="server" Culture="en-US" 
                                                                    Skin="Sunset" Value="0" Width="200px">
                                                                </telerik:RadNumericTextBox>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </asp:Panel>
                                            </telerik:RadPageView>
                                        </telerik:RadMultiPage>
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#666666">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="height: 11px">
                                        <asp:Label ID="Label144" runat="server" Text="Notes"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height: 34px">
                                        <telerik:RadTextBox ID="txtcomment" Runat="server" Font-Size="Medium" 
                                            Height="50px" Skin="Sunset" TextMode="MultiLine" Width="450px">
                                        </telerik:RadTextBox>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height: 34px">
                                        <asp:CheckBox ID="chkassembly" runat="server" Text="Documentation Complete" 
                                            Font-Bold="True" Font-Size="Medium" />
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height: 41px">
                                        <telerik:RadButton ID="btnforward" runat="server" Skin="Simple" Text="Forward " 
                                            Width="200px">
                                        </telerik:RadButton>
                                        &nbsp;<asp:Label ID="lblerr" runat="server" Font-Bold="True" ForeColor="Red" 
                                            Font-Size="Medium"></asp:Label>
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="100%">
                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridBoundColumn DataField="Note_date" 
                                                            FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                            ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                            FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                            ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Note_From" 
                                                            FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                            ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Notes" 
                                                            FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                            SortExpression="Notes" UniqueName="Notes">
                                                        </telerik:GridBoundColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <ItemStyle Wrap="False" />
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                                        </td>
                                </tr>
                            </table>
   </asp:Panel>
   </div>
</ContentTemplate>
          <Triggers>
        <asp:PostBackTrigger ControlID = "btnupload" />
          </Triggers>
          </asp:UpdatePanel>
</asp:Content>


